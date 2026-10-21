'use server'

import { revalidatePath } from 'next/cache'
import type { Audience } from '@/entities/announcement'
import { createAnnouncement, deleteAnnouncement, getAnnouncement } from '@/entities/announcement/server'
import { courseCompany, getCourse, listStudents } from '@/entities/course/server'
import { parentsOf, schoolParents } from '@/entities/family/server'
import type { Recipient } from '@/entities/notification'
import { notify } from '@/entities/notification/server'
import { getClass } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { getTenantName, isSchool, schoolPeople } from '@/entities/tenant/server'
import { formId, formText } from '@/shared/lib/form'
import type { SessionUser } from '@/entities/session'

export type AnnouncementState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: 'invalid' | 'server'; at: number }

type Target = { companyId: number; audience: Audience; target: { id: number; name: string } | null; label: string; recipients: Recipient[] }

/**
 * Who may post where, and who it reaches:
 *  - whole school → a manager of a school; everyone in it + the students' parents;
 *  - one class    → a manager of the class's school; its students, class teachers and their parents;
 *  - one course   → a teacher of the course (or a manager of its school); its students and their parents.
 * null = not allowed / not found.
 */
async function resolveTarget(user: SessionUser, audience: string, targetId: number): Promise<Target | null> {
  if (audience === 'school') {
    if (user.role !== 'manager' || !user.companyId || !(await isSchool(user.companyId))) return null
    const [school, people, parents] = await Promise.all([
      getTenantName(user.companyId),
      schoolPeople(user.userId, user.companyId),
      schoolParents(user.companyId),
    ])
    return { companyId: user.companyId, audience, target: null, label: school ?? '', recipients: [...people.filter((p) => !p.pending), ...parents] }
  }
  if (audience === 'class') {
    if (user.role !== 'manager' || !targetId) return null
    const k = await getClass(user.userId, targetId)
    if (!k?.canManage || k.companyId !== user.companyId) return null
    const [school, parents] = await Promise.all([getTenantName(k.companyId), parentsOf(k.students.map((s) => s.id))])
    return {
      companyId: k.companyId,
      audience,
      target: { id: k.id, name: k.name },
      label: [school, k.name].filter(Boolean).join(' · '),
      recipients: [...k.students, ...k.teachers, ...parents],
    }
  }
  if (audience === 'course') {
    if (!targetId) return null
    const course = await getCourse(user.userId, targetId)
    if (!course?.canEdit) return null
    const students = await listStudents(user.userId, targetId)
    const [companyId, parents] = await Promise.all([courseCompany(targetId), parentsOf(students.map((s) => s.id))])
    return {
      companyId: companyId ?? user.companyId ?? 0,
      audience,
      target: { id: course.id, name: course.title },
      label: course.title,
      recipients: [...students, ...parents],
    }
  }
  return null
}

/** Post an announcement to a school, a class or a course; its people are told (bell + email). */
export async function postAnnouncementAction(_prev: AnnouncementState, form: FormData): Promise<AnnouncementState> {
  const user = await requireRole('manager', 'teacher')
  const at = Date.now()
  const title = formText(form, 'title').slice(0, 200)
  const body = formText(form, 'body').slice(0, 4000)
  if (!title) return { status: 'error', error: 'invalid', at }
  try {
    const t = await resolveTarget(user, formText(form, 'audience'), formId(form, 'targetId'))
    if (!t || !t.companyId) return { status: 'error', error: 'invalid', at }
    await createAnnouncement({ companyId: t.companyId, author: { id: user.userId, name: user.name }, audience: t.audience, target: t.target, title, body })
    const preview = body.length > 300 ? `${body.slice(0, 300)}…` : body
    await notify(
      t.recipients.filter((p) => p.id !== user.userId),
      'announcement',
      { school: t.label, title, body: preview },
      '/',
    )
  } catch (e) {
    console.error('post announcement failed', e)
    return { status: 'error', error: 'server', at }
  }
  revalidatePath('/', 'layout')
  return { status: 'saved', at }
}

/** Delete: a manager of its school, or (course announcements) a teacher of the course. */
export async function deleteAnnouncementAction(form: FormData) {
  const user = await requireRole('manager', 'teacher')
  const a = await getAnnouncement(formId(form, 'announcementId'))
  if (!a) return
  const managerOfIt = user.role === 'manager' && user.companyId === a.companyId
  const teachesIt = a.audience === 'course' && a.targetId !== null && !!(await getCourse(user.userId, a.targetId))?.canEdit
  if (!managerOfIt && !teachesIt) return
  await deleteAnnouncement(a.id)
  revalidatePath('/', 'layout')
}
