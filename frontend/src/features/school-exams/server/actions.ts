'use server'

import { revalidatePath } from 'next/cache'
import { notify } from '@/entities/notification/server'
import { examAudience, examSpace, getQuiz, quizResults, setExamAudience } from '@/entities/quiz/server'
import { outcomeOf } from '@/entities/quiz'
import { getClass } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { createInvite, getTenantName, isSchool, pendingInvitesOf, schoolPeople } from '@/entities/tenant/server'
import { createInvitedUser, getAccount } from '@/entities/user/server'
import { dirOf } from '@/shared/i18n'
import { getLocale, getT } from '@/shared/i18n/server'
import { composeMail } from '@/shared/server/mail-layout'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { issueToken } from '@/shared/server/tokens'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INVITE_DAYS = 7
const MAX_AT_ONCE = 300

/** A manager of a school, and one of that school's exams (null if not). */
async function managerExam(quizId: number) {
  const user = await requireRole('manager')
  if (!user.companyId || !Number.isSafeInteger(quizId) || !(await isSchool(user.companyId))) return null
  const [space, quiz] = await Promise.all([examSpace(user.userId, user.companyId), getQuiz(user.userId, quizId)])
  if (!quiz || quiz.courseId !== space) return null // not this school's exam
  return { user, companyId: user.companyId, quiz }
}

export type Candidate = { firstName: string; lastName: string; email: string }
export type AddAudienceResult = { ok: true; added: number; invited: number; skipped: number } | { ok: false }

/**
 * Give the exam to whole classes (their current students), chosen students of the school, and
 * candidates by email: existing accounts are added (and told, if the exam is published); new people
 * get a suspended account and an invite link that names the exam.
 */
export async function addAudienceAction(quizId: number, input: { classIds?: number[]; studentIds?: number[]; candidates?: Candidate[] }): Promise<AddAudienceResult> {
  const ctx = await managerExam(quizId)
  if (!ctx) return { ok: false }
  const { user, companyId, quiz } = ctx
  const classIds = (input?.classIds ?? []).filter((n) => Number.isSafeInteger(n) && n > 0).slice(0, 50)
  const studentIds = new Set((input?.studentIds ?? []).filter((n) => Number.isSafeInteger(n) && n > 0))
  const candidates = (input?.candidates ?? []).slice(0, MAX_AT_ONCE)
  let skipped = 0
  try {
    // only students who really are in this school
    const people = await schoolPeople(user.userId, companyId)
    const ids = new Set([...studentIds].filter((id) => people.some((p) => p.id === id && p.role === 'student')))
    for (const classId of classIds) {
      const k = await getClass(user.userId, classId)
      if (k?.canManage && k.companyId === companyId) k.students.forEach((s) => ids.add(s.id))
    }
    // candidates: existing accounts by email, new ones get an invite
    const school = (await getTenantName(companyId)) ?? ''
    const t = await getT()
    const dir = dirOf(await getLocale())
    let invited = 0
    for (const c of candidates) {
      const email = String(c?.email ?? '').trim().toLowerCase()
      const firstname = String(c?.firstName ?? '').trim().slice(0, 100)
      const lastname = String(c?.lastName ?? '').trim().slice(0, 100)
      if (!EMAIL.test(email)) {
        skipped++
        continue
      }
      const account = await getAccount(email)
      if (account.found) {
        ids.add(account.id)
        continue
      }
      if (!firstname || !lastname) {
        skipped++
        continue
      }
      const id = await createInvitedUser({ email, firstname, lastname })
      ids.add(id)
      const token = await issueToken('invite', id, INVITE_DAYS * 24 * 60)
      await sendMail({
        to: email,
        subject: t.email.examInvite.subject(school),
        ...composeMail(t, dir, {
          title: t.email.examInvite.subject(school),
          name: firstname,
          body: t.email.examInvite.body({ school, exam: quiz.name, by: user.name }),
          action: t.email.examInvite.action,
          link: appUrl(`/accept-invite?token=${token}`),
        }),
      })
      invited++
    }
    const added = await setExamAudience(user.userId, companyId, quizId, [...ids], [])
    // tell existing accounts newly given a published exam (new candidates got their invite email)
    if (quiz.published && added.length) {
      const audience = await examAudience(user.userId, companyId, quizId)
      const told = audience.filter((a) => added.includes(a.id) && !a.pending)
      await notify(told, 'examInvite', { school, exam: quiz.name }, `/classes/${quiz.courseId}/quizzes/${quizId}`)
    }
    revalidatePath(`/school/exams/${quizId}`)
    return { ok: true, added: added.length, invited, skipped }
  } catch (e) {
    console.error('add exam audience failed', e)
    return { ok: false }
  }
}

/** Take the exam from someone (before they've taken it — results stay). */
export async function removeFromAudienceAction(quizId: number, userId: number) {
  const ctx = await managerExam(quizId)
  if (!ctx || !Number.isSafeInteger(userId)) return
  await setExamAudience(ctx.user.userId, ctx.companyId, quizId, [], [userId])
  revalidatePath(`/school/exams/${quizId}`)
}

/**
 * Invite people who took the exam into the school as students — only those who passed it and aren't
 * in the school or invited yet. They join when they accept (existing invite flow).
 */
export async function inviteToSchoolAction(quizId: number, userIds: number[]): Promise<{ ok: true; invited: number } | { ok: false }> {
  const ctx = await managerExam(quizId)
  if (!ctx) return { ok: false }
  const { user, companyId, quiz } = ctx
  try {
    const [results, audience, pending, school] = await Promise.all([
      quizResults(user.userId, quizId),
      examAudience(user.userId, companyId, quizId),
      pendingInvitesOf(companyId),
      getTenantName(companyId),
    ])
    const passed = new Set((results?.students ?? []).filter((s) => s.grade !== null && outcomeOf(s.grade, quiz.passMark) !== 'failed').map((s) => s.id))
    const wanted = new Set(userIds.filter((n) => Number.isSafeInteger(n)))
    let invited = 0
    for (const a of audience) {
      if (!wanted.has(a.id) || !passed.has(a.id) || a.member || pending.some((p) => p.userId === a.id)) continue
      if (await createInvite(companyId, a.id, 'student', { id: user.userId, name: user.name })) {
        await notify([a], 'schoolInvite', { school: school ?? '', by: user.name, role: 'student' }, '/invites')
        invited++
      }
    }
    revalidatePath(`/school/exams/${quizId}/results`)
    return { ok: true, invited }
  } catch (e) {
    console.error('invite exam takers failed', e)
    return { ok: false }
  }
}
