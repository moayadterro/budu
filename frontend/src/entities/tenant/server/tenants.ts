import 'server-only'
import { defaultInstance, iomadCall } from '@/shared/server/iomad'
import { toPerson, type Person, type RawPerson } from '@/shared/lib/person'
import { query } from '@/shared/server/db'
import { DEFAULT_SCALE, isGradeScale, type GradeScale } from '@/shared/lib/grade-scale'

/** Tenants = IOMAD companies, plus the kind we recorded at sign-up. SERVER-SIDE ONLY. */

export type TenantKind = 'school' | 'teacher' | 'unknown'
export type Tenant = {
  companyId: number
  name: string
  city: string
  country: string
  suspended: boolean
  kind: TenantKind
}

type Company = { id: number; name: string; city: string; country: string; suspended: number }

export async function listTenants(): Promise<Tenant[]> {
  const iomad = defaultInstance()
  // get_companies needs a criterion; asking for active and suspended covers all of them.
  const companies = (suspended: 0 | 1) =>
    iomadCall<{ companies: Company[] }>(iomad, 'block_iomad_company_admin_get_companies', {
      criteria: [{ key: 'suspended', value: suspended }],
    }).then((r) => r.companies)
  const [active, suspended, kinds] = await Promise.all([
    companies(0),
    companies(1),
    query<{ company_id: number; kind: TenantKind }>(`SELECT company_id, kind FROM tenants WHERE iomad_url = $1`, [iomad.url]),
  ])

  const kindOf = new Map(kinds.map((k) => [k.company_id, k.kind]))
  return [...active, ...suspended]
    .map((c) => ({
      companyId: c.id,
      name: c.name,
      city: c.city,
      country: c.country,
      suspended: !!c.suspended,
      kind: kindOf.get(c.id) ?? 'unknown',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** The tenant's grade display scale ('percent' when unknown or not a registered tenant). */
export async function getGradeScale(companyId: number | null): Promise<GradeScale> {
  if (!companyId) return DEFAULT_SCALE
  const [row] = await query<{ grade_scale: string }>(`SELECT grade_scale FROM tenants WHERE iomad_url = $1 AND company_id = $2`, [
    defaultInstance().url,
    companyId,
  ])
  return isGradeScale(row?.grade_scale) ? row.grade_scale : DEFAULT_SCALE
}

export async function setGradeScale(companyId: number, scale: GradeScale) {
  await query(`UPDATE tenants SET grade_scale = $3 WHERE iomad_url = $1 AND company_id = $2`, [defaultInstance().url, companyId, scale])
}

/** The tenant's display name as registered in app-db (null if not registered). */
export async function getTenantName(companyId: number | null): Promise<string | null> {
  if (!companyId) return null
  const [row] = await query<{ name: string }>(`SELECT name FROM tenants WHERE iomad_url = $1 AND company_id = $2`, [
    defaultInstance().url,
    companyId,
  ])
  return row?.name ?? null
}

// ----- school (company) people & courses, for managers -----

export type SchoolRole = 'manager' | 'teacher' | 'student'
/** `className`: their class in this school ('' = none; a student is in at most one). */
export type SchoolPerson = Person & { role: SchoolRole; pending: boolean; classId: number | null; className: string }
export type SchoolCourse = {
  id: number
  title: string
  published: boolean
  teachers: string
  students: number
  lessons: number
  homework: number
}

/** Everyone in the school with their role; `pending` = invited, not activated yet. */
export async function schoolPeople(userId: number, companyId: number): Promise<SchoolPerson[]> {
  const rows = await iomadCall<Array<RawPerson & { role: SchoolRole; suspended: boolean; classid: number; classname: string }>>(
    defaultInstance(),
    'local_budu_company_people',
    {
      companyid: companyId,
      userid: userId,
    },
  )
  return rows.map((r) => ({ ...toPerson(r), role: r.role, pending: r.suspended, classId: r.classid || null, className: r.classname }))
}

export async function schoolCourses(userId: number, companyId: number): Promise<SchoolCourse[]> {
  const rows = await iomadCall<
    Array<{ id: number; fullname: string; visible: boolean; teachers: string; students: number; lessons: number; homework: number }>
  >(defaultInstance(), 'local_budu_company_courses', { companyid: companyId, userid: userId })
  return rows.map((c) => ({
    id: c.id,
    title: c.fullname,
    published: c.visible,
    teachers: c.teachers,
    students: c.students,
    lessons: c.lessons,
    homework: c.homework,
  }))
}

/** Adds (or updates) a user in the school: teacher = educator, manager = company manager, student = plain member. */
export async function addToSchool(companyId: number, userId: number, role: SchoolRole) {
  await iomadCall(defaultInstance(), 'block_iomad_company_admin_assign_users', {
    users: [{ userid: userId, companyid: companyId, managertype: role === 'manager' ? 1 : 0, educator: role === 'teacher' ? 1 : 0 }],
  })
}

/** Changes someone's role in the school (IOMAD flags; plugin checks the acting manager). */
export async function setSchoolRole(managerId: number, companyId: number, userId: number, role: SchoolRole) {
  await iomadCall(defaultInstance(), 'local_budu_set_role', { companyid: companyId, userid: managerId, targetid: userId, role })
}

/** Is this company registered as a school (vs. a solo teacher's own tenant / none)? */
export async function isSchool(companyId: number | null): Promise<boolean> {
  if (!companyId) return false
  const [row] = await query<{ kind: string }>(`SELECT kind FROM tenants WHERE iomad_url = $1 AND company_id = $2`, [
    defaultInstance().url,
    companyId,
  ])
  return row?.kind === 'school'
}

/** Which of these companies are registered as schools. */
export async function schoolsAmong(companyIds: number[]): Promise<number[]> {
  if (!companyIds.length) return []
  const rows = await query<{ company_id: number }>(
    `SELECT company_id FROM tenants WHERE iomad_url = $1 AND kind = 'school' AND company_id = ANY($2::int[])`,
    [defaultInstance().url, companyIds],
  )
  return rows.map((r) => r.company_id)
}

// ----- invitations (existing accounts must accept before joining a school) -----

export type SchoolInvite = {
  id: number
  companyId: number
  school: string
  userId: number
  role: SchoolRole
  invitedBy: string
  invitedById: number | null
  /** unix seconds */
  createdAt: number
}

type InviteRow = {
  id: string
  company_id: number
  name: string | null
  iomad_user_id: number
  role: SchoolRole
  invited_by: string
  invited_by_id: number | null
  created: number
}
const toInvite = (r: InviteRow): SchoolInvite => ({
  id: Number(r.id),
  companyId: r.company_id,
  school: r.name ?? '',
  userId: r.iomad_user_id,
  role: r.role,
  invitedBy: r.invited_by,
  invitedById: r.invited_by_id,
  createdAt: r.created,
})
const INVITE_SELECT = `SELECT i.id, i.company_id, t.name, i.iomad_user_id, i.role, i.invited_by, i.invited_by_id, extract(epoch FROM i.created_at)::int AS created
    FROM school_invites i LEFT JOIN tenants t ON t.iomad_url = i.iomad_url AND t.company_id = i.company_id`

/** Creates a pending invitation; false if one is already pending for this person and school. */
export async function createInvite(
  companyId: number,
  userId: number,
  role: SchoolRole,
  invitedBy: { id: number; name: string },
): Promise<boolean> {
  const url = defaultInstance().url
  const pending = await query(`SELECT 1 FROM school_invites WHERE iomad_url = $1 AND company_id = $2 AND iomad_user_id = $3 AND status = 'pending'`, [
    url,
    companyId,
    userId,
  ])
  if (pending.length) return false
  await query(
    `INSERT INTO school_invites (iomad_url, company_id, iomad_user_id, role, invited_by, invited_by_id) VALUES ($1, $2, $3, $4, $5, $6)`,
    [url, companyId, userId, role, invitedBy.name, invitedBy.id],
  )
  return true
}

/** Invitations waiting for this person's answer. */
export async function invitesFor(userId: number): Promise<SchoolInvite[]> {
  const rows = await query<InviteRow>(`${INVITE_SELECT} WHERE i.iomad_user_id = $1 AND i.status = 'pending' AND i.iomad_url = $2 ORDER BY i.created_at DESC`, [
    userId,
    defaultInstance().url,
  ])
  return rows.map(toInvite)
}

/** The school's invitations still waiting for an answer. */
export async function pendingInvitesOf(companyId: number): Promise<SchoolInvite[]> {
  const rows = await query<InviteRow>(`${INVITE_SELECT} WHERE i.company_id = $1 AND i.status = 'pending' AND i.iomad_url = $2 ORDER BY i.created_at DESC`, [
    companyId,
    defaultInstance().url,
  ])
  return rows.map(toInvite)
}

/**
 * The invited person answers. Accept → they join the school in IOMAD with the invited role, and their
 * sessions re-read their role on the next request. Returns the invite, or null if not theirs / not pending.
 */
export async function answerInvite(userId: number, inviteId: number, accept: boolean): Promise<SchoolInvite | null> {
  const [row] = await query<InviteRow>(`${INVITE_SELECT} WHERE i.id = $1 AND i.iomad_user_id = $2 AND i.status = 'pending'`, [inviteId, userId])
  if (!row) return null
  const invite = toInvite(row)
  if (accept) await addToSchool(invite.companyId, userId, invite.role)
  await query(`UPDATE school_invites SET status = $2, responded_at = now() WHERE id = $1`, [inviteId, accept ? 'accepted' : 'declined'])
  if (accept) await query(`UPDATE sessions SET refreshed_at = 'epoch' WHERE iomad_user_id = $1`, [userId])
  return invite
}

/** Manager withdraws a pending invitation of their school. */
export async function cancelInvite(companyId: number, inviteId: number) {
  await query(`UPDATE school_invites SET status = 'cancelled', responded_at = now() WHERE id = $1 AND company_id = $2 AND status = 'pending'`, [
    inviteId,
    companyId,
  ])
}
