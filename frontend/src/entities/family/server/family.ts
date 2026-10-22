import 'server-only'
import { query } from '@/shared/server/db'
import { prefsOfUser, setPref } from '@/shared/server/user-prefs'
import { defaultInstance, iomadCall } from '@/shared/server/iomad'
import { toPerson, type RawPerson } from '@/shared/lib/person'
import type { ChildCourse, Family, FamilyMember, ParentRequest } from '../model/types'

/**
 * Parents and children. Accepted links live in IOMAD (role budu_parent in the child's user context,
 * local_budu family functions); requests (pending / declined …) live in app-db `parent_requests`.
 * Callers check the session; these helpers trust the ids they get. SERVER-SIDE ONLY.
 */

const call = <T>(fn: string, params: Record<string, unknown>) => iomadCall<T>(defaultInstance(), `local_budu_${fn}`, params)

type RawMember = RawPerson & { schools: Array<{ companyid: number; name: string }> }
const member = (m: RawMember): FamilyMember => ({ ...toPerson(m), schools: m.schools.map((s) => ({ companyId: s.companyid, name: s.name })) })

export async function getFamily(userId: number): Promise<Family> {
  const f = await call<{ parents: RawMember[]; children: RawMember[] }>('family', { userid: userId })
  return { parents: f.parents.map(member), children: f.children.map(member) }
}

/** The child, if `parentId` is their (accepted) parent. */
export async function childOf(parentId: number, childId: number): Promise<FamilyMember | null> {
  return (await getFamily(parentId)).children.find((c) => c.id === childId) ?? null
}

export async function childCourses(childId: number): Promise<ChildCourse[]> {
  const rows = await call<Array<{ courseid: number; coursename: string; teachers: RawPerson[] }>>('child_teachers', { childid: childId })
  return rows.map((r) => ({ courseId: r.courseid, courseTitle: r.coursename, teachers: r.teachers.map(toPerson) }))
}

/** Does `teacherId` teach one of the child's courses? */
export async function teachesChild(teacherId: number, childId: number) {
  return (await childCourses(childId)).some((c) => c.teachers.some((t) => t.id === teacherId))
}

export const unlinkParent = (parentId: number, childId: number) => call('unlink_parent', { parentid: parentId, childid: childId })

// ----- requests -----

type Row = { id: string; child_id: number; parent_id: number; created: number }
const request = (r: Row, names: Map<number, { name: string; email: string }>): ParentRequest => ({
  id: Number(r.id),
  childId: r.child_id,
  childName: names.get(r.child_id)?.name ?? '',
  parentId: r.parent_id,
  parentName: names.get(r.parent_id)?.name ?? '',
  parentEmail: names.get(r.parent_id)?.email ?? '',
  createdAt: r.created,
})

async function names(ids: number[]) {
  const unique = [...new Set(ids)]
  if (!unique.length) return new Map<number, { name: string; email: string }>()
  const users = await iomadCall<Array<{ id: number; fullname: string; email: string }>>(defaultInstance(), 'core_user_get_users_by_field', {
    field: 'id',
    values: unique,
  })
  return new Map(users.map((u) => [u.id, { name: u.fullname, email: u.email }]))
}

async function pending(where: string, id: number) {
  const rows = await query<Row>(
    `SELECT id, child_id, parent_id, extract(epoch FROM created_at)::int AS created
       FROM parent_requests WHERE ${where} = $1 AND status = 'pending' ORDER BY created_at`,
    [id],
  )
  const n = await names(rows.flatMap((r) => [r.child_id, r.parent_id]))
  return rows.map((r) => request(r, n))
}

/** Requests waiting for this parent's answer. */
export const requestsForParent = (parentId: number) => pending('parent_id', parentId)
/** Requests this child sent that are not answered yet. */
export const requestsOfChild = (childId: number) => pending('child_id', childId)

/** A new pending request; false if one is already pending for the same pair. */
export async function createParentRequest(childId: number, parentId: number): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `INSERT INTO parent_requests (child_id, parent_id)
     SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM parent_requests WHERE child_id = $1 AND parent_id = $2 AND status = 'pending')
     RETURNING id`,
    [childId, parentId],
  )
  return rows.length > 0
}

/** The parent answers; accepting links them in IOMAD. Returns the request, or null if it isn't theirs / not pending. */
export async function answerParentRequest(parentId: number, requestId: number, accept: boolean): Promise<{ childId: number } | null> {
  const [row] = await query<{ child_id: number }>(
    `UPDATE parent_requests SET status = $3, responded_at = now()
      WHERE id = $1 AND parent_id = $2 AND status = 'pending' RETURNING child_id`,
    [requestId, parentId, accept ? 'accepted' : 'declined'],
  )
  if (!row) return null
  if (accept) await call('link_parent', { parentid: parentId, childid: row.child_id })
  return { childId: row.child_id }
}

/** A new parent activated their account from the invite link: that accepts every request sent to them. */
export async function acceptAllFor(parentId: number): Promise<number[]> {
  const rows = await query<{ child_id: number }>(
    `UPDATE parent_requests SET status = 'accepted', responded_at = now()
      WHERE parent_id = $1 AND status = 'pending' RETURNING child_id`,
    [parentId],
  )
  for (const r of rows) await call('link_parent', { parentid: parentId, childid: r.child_id })
  return rows.map((r) => r.child_id)
}

/** The child withdraws a request they sent. */
export async function cancelParentRequest(childId: number, requestId: number) {
  await query(`UPDATE parent_requests SET status = 'cancelled', responded_at = now() WHERE id = $1 AND child_id = $2 AND status = 'pending'`, [
    requestId,
    childId,
  ])
}

// ----- the "add your parent" step after sign-up -----

export async function skipParentPrompt(userId: number) {
  await setPref(userId, 'budu_parent_skipped', '1')
}

/** Show the step: a student with no parent, no request sent, and who hasn't skipped it. */
export async function needsParentStep(userId: number): Promise<boolean> {
  const [[row], prefs] = await Promise.all([
    query<{ asked: boolean }>(`SELECT EXISTS (SELECT 1 FROM parent_requests WHERE child_id = $1) AS asked`, [userId]),
    prefsOfUser(userId),
  ])
  if (prefs.parentSkipped || row?.asked) return false
  return (await getFamily(userId)).parents.length === 0
}

/** Parents of everyone in a school (they get the school's announcements too). */
export async function schoolParents(companyId: number) {
  return (await call<RawPerson[]>('company_parents', { companyid: companyId })).map(toPerson)
}

/** The parents of these students, each once (class / course announcements reach them too). */
export async function parentsOf(studentIds: number[]) {
  if (!studentIds.length) return []
  return (await call<RawPerson[]>('parents_of', { userids: studentIds })).map(toPerson)
}
