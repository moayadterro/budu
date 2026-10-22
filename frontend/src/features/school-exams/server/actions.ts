'use server'

import { revalidatePath } from 'next/cache'
import { notify } from '@/entities/notification/server'
import { claimExamNudges, examAudience, examSpace, getQuiz, quizResults, setExamAudience } from '@/entities/quiz/server'
import { outcomeOf } from '@/entities/quiz'
import { getClass } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { createInvite, getTenantName, isSchool, pendingInvitesOf, schoolPeople } from '@/entities/tenant/server'
import { createInvitedUser, getAccount } from '@/entities/user/server'
import { dirOf } from '@/shared/i18n'
import { getLocale, getT } from '@/shared/i18n/server'
import { composeMail } from '@/shared/server/mail-layout'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { issuedRecently, issueToken } from '@/shared/server/tokens'
import { splitFullName } from '@/shared/lib/person-name'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INVITE_DAYS = 7
const MAX_AT_ONCE = 300

/** A manager of a school, and one of that school's exams (null if not). */
async function managerExam(quizId: number) {
  const user = await requireRole('manager')
  if (!user.companyId || !Number.isSafeInteger(quizId) || !(await isSchool(user.companyId))) return null
  const [space, quiz] = await Promise.all([examSpace(user.userId, user.companyId), getQuiz(user.userId, quizId)])
  if (!quiz || quiz.courseId !== space) return null // not this school's exam
  return { user, companyId: user.companyId, quiz, quizId }
}

export type AddAudienceResult = { ok: true; added: number } | { ok: false }

/** Give the exam to whole classes (their current students) and chosen students of the school. */
export async function addAudienceAction(quizId: number, input: { classIds?: number[]; studentIds?: number[] }): Promise<AddAudienceResult> {
  const ctx = await managerExam(quizId)
  if (!ctx) return { ok: false }
  const { user, companyId, quiz } = ctx
  const classIds = (input?.classIds ?? []).filter((n) => Number.isSafeInteger(n) && n > 0).slice(0, 50)
  const studentIds = new Set((input?.studentIds ?? []).filter((n) => Number.isSafeInteger(n) && n > 0))
  try {
    // only students who really are in this school
    const people = await schoolPeople(user.userId, companyId)
    const ids = new Set([...studentIds].filter((id) => people.some((p) => p.id === id && p.role === 'student')))
    for (const classId of classIds) {
      const k = await getClass(user.userId, classId)
      if (k?.canManage && k.companyId === companyId) k.students.forEach((s) => ids.add(s.id))
    }
    const added = await setExamAudience(user.userId, companyId, quizId, [...ids], [])
    audit('examAudienceAdded', { target: `quiz ${quizId}`, details: { classes: classIds.length, students: studentIds.size, added: added.length } })
    await tellAdded(ctx, added)
    revalidatePath(`/school/exams/${quizId}`)
    return { ok: true, added: added.length }
  } catch (e) {
    reportError('add exam audience failed', e)
    return { ok: false }
  }
}

/** Tell existing (activated) accounts newly given a PUBLISHED exam — bell + email. */
async function tellAdded({ user, companyId, quiz, quizId }: NonNullable<Awaited<ReturnType<typeof managerExam>>>, added: number[]) {
  if (!quiz.published || !added.length) return
  const school = (await getTenantName(companyId)) ?? ''
  const audience = await examAudience(user.userId, companyId, quizId)
  const told = audience.filter((a) => added.includes(a.id) && !a.pending)
  await notify(told, 'examInvite', { school, exam: quiz.name }, `/classes/${quiz.courseId}/quizzes/${quizId}`)
}

/** The invite email (new account, or one not activated yet): a 7-day link that names the exam. */
async function sendExamInvite(ctx: NonNullable<Awaited<ReturnType<typeof managerExam>>>, to: { id: number; email: string; firstname: string }) {
  const school = (await getTenantName(ctx.companyId)) ?? ''
  const t = await getT()
  const dir = dirOf(await getLocale())
  const token = await issueToken('invite', to.id, INVITE_DAYS * 24 * 60)
  const e = t.email.examInvite
  await sendMail({
    to: to.email,
    subject: e.subject(ctx.quiz.name),
    ...composeMail(t, dir, {
      title: e.title,
      name: to.firstname,
      body: e.body({ school, by: ctx.user.name }),
      details: [
        { label: e.details.exam, value: ctx.quiz.name },
        { label: e.details.school, value: school },
        { label: e.details.by, value: ctx.user.name },
      ],
      steps: { title: e.stepsTitle, items: e.steps },
      action: e.action,
      link: appUrl(`/accept-invite?token=${token}`),
      footer: e.validity,
    }),
  })
}

export type Candidate = { fullName: string; email: string }
/**
 * What happened to ONE row, so the form can keep exactly the rows that need fixing:
 * invited = new account + email · reinvited = not activated yet, invitation sent again ·
 * added = has an account, got the exam · already = had it · mailFailed = given the exam but the
 * email didn't go out (resend from the list) · badEmail · needName (new people need a full name) ·
 * admin (platform administrators can't take exams) · failed (the account couldn't be created).
 */
export type CandidateOutcome = 'invited' | 'reinvited' | 'added' | 'already' | 'mailFailed' | 'badEmail' | 'needName' | 'admin' | 'failed'
export type InviteCandidatesResult = { ok: true; rows: CandidateOutcome[] } | { ok: false }

/** Candidates by full name + email, one result per row (in the same order). */
export async function inviteCandidatesAction(quizId: number, input: Candidate[]): Promise<InviteCandidatesResult> {
  const ctx = await managerExam(quizId)
  if (!ctx) return { ok: false }
  const rows = (Array.isArray(input) ? input : []).slice(0, MAX_AT_ONCE)
  const outcomes: CandidateOutcome[] = []
  const toAdd: Array<{ row: number; id: number }> = []
  const toEmail: Array<{ row: number; id: number; email: string; firstname: string }> = []
  try {
    for (const [i, c] of rows.entries()) {
      const email = String(c?.email ?? '').trim().toLowerCase()
      const fullName = String(c?.fullName ?? '').trim().slice(0, 200)
      outcomes[i] = 'added'
      if (!EMAIL.test(email)) {
        outcomes[i] = 'badEmail'
        continue
      }
      const account = await getAccount(email)
      if (account.found && account.siteadmin) {
        outcomes[i] = 'admin'
        continue
      }
      if (account.found) {
        toAdd.push({ row: i, id: account.id })
        // not activated yet → sending the row again re-sends the invitation (throttled)
        if (account.suspended && !(await issuedRecently('invite', account.id, 60))) {
          toEmail.push({ row: i, id: account.id, email, firstname: account.firstname })
          outcomes[i] = 'reinvited'
        }
        continue
      }
      const name = splitFullName(fullName)
      if (!name) {
        outcomes[i] = 'needName'
        continue
      }
      const id = await createInvitedUser({ email, firstname: name.first, middlename: name.middle, lastname: name.last }).catch((e) => {
        reportError('exam candidate account failed', e)
        return null
      })
      if (id === null) {
        outcomes[i] = 'failed'
        continue
      }
      toAdd.push({ row: i, id })
      toEmail.push({ row: i, id, email, firstname: name.first })
      outcomes[i] = 'invited'
    }
    const added = await setExamAudience(ctx.user.userId, ctx.companyId, quizId, toAdd.map((a) => a.id), [])
    for (const a of toAdd) if (outcomes[a.row] === 'added' && !added.includes(a.id)) outcomes[a.row] = 'already'
    for (const m of toEmail) {
      await sendExamInvite(ctx, m).catch((e) => {
        reportError('exam invite email failed', e)
        outcomes[m.row] = 'mailFailed'
      })
    }
    await tellAdded(ctx, added.filter((id) => !toEmail.some((m) => m.id === id)))
    audit('examCandidatesInvited', {
      target: `quiz ${quizId}`,
      details: Object.fromEntries([...new Set(outcomes)].map((o) => [o, outcomes.filter((x) => x === o).length])),
      ok: outcomes.every((o) => !['badEmail', 'needName', 'admin', 'failed', 'mailFailed'].includes(o)),
    })
    revalidatePath(`/school/exams/${quizId}`)
    return { ok: true, rows: outcomes }
  } catch (e) {
    reportError('invite exam candidates failed', e)
    return { ok: false }
  }
}

/** Who on the exam's list has started it (any attempt: in progress, waiting for grading, finished). */
async function startedIds(userId: number, quizId: number) {
  const results = await quizResults(userId, quizId)
  return new Set((results?.students ?? []).filter((s) => s.state !== 'notstarted').map((s) => s.id))
}

export type RemindResult = { ok: true; invited: number; reminded: number; recent: number } | { ok: false }

/**
 * Nudge people on the list who haven't acted: those who haven't accepted their invitation get it
 * again; those who can take the exam but haven't started get a reminder (bell + email). Anyone
 * already nudged in the last hour is skipped (`recent`); people who started are never nudged.
 */
export async function remindAction(quizId: number, userIds: number[]): Promise<RemindResult> {
  const ctx = await managerExam(quizId)
  if (!ctx) return { ok: false }
  const wanted = new Set((Array.isArray(userIds) ? userIds : []).filter((n) => Number.isSafeInteger(n) && n > 0).slice(0, 1000))
  try {
    const [audience, started] = await Promise.all([examAudience(ctx.user.userId, ctx.companyId, quizId), startedIds(ctx.user.userId, quizId)])
    const people = audience.filter((a) => wanted.has(a.id) && !started.has(a.id))
    let invited = 0
    let recent = 0
    for (const a of people.filter((p) => p.pending)) {
      if (await issuedRecently('invite', a.id, 3600)) {
        recent++
        continue
      }
      const account = await getAccount(a.email)
      if (!account.found || !account.suspended) continue
      await sendExamInvite(ctx, { id: account.id, email: account.email, firstname: account.firstname })
      invited++
    }
    const notStarted = people.filter((p) => !p.pending)
    const claimed = new Set(await claimExamNudges(quizId, notStarted.map((p) => p.id)))
    recent += notStarted.length - claimed.size
    const school = (await getTenantName(ctx.companyId)) ?? ''
    await notify(
      notStarted.filter((p) => claimed.has(p.id)),
      'examNudge',
      { school, exam: ctx.quiz.name },
      `/classes/${ctx.quiz.courseId}/quizzes/${quizId}`,
    )
    audit('examReminded', { target: `quiz ${quizId}`, details: { invited, reminded: claimed.size, recent } })
    return { ok: true, invited, reminded: claimed.size, recent }
  } catch (e) {
    reportError('exam reminders failed', e)
    return { ok: false }
  }
}

/** Send the invitation again to someone on the list who hasn't activated their account yet. */
export async function resendExamInviteAction(quizId: number, userId: number): Promise<'sent' | 'recent' | 'failed'> {
  const ctx = await managerExam(quizId)
  if (!ctx || !Number.isSafeInteger(userId)) return 'failed'
  try {
    const person = (await examAudience(ctx.user.userId, ctx.companyId, quizId)).find((a) => a.id === userId && a.pending)
    if (!person) return 'failed'
    if (await issuedRecently('invite', userId, 60)) return 'recent'
    const account = await getAccount(person.email)
    if (!account.found || !account.suspended) return 'failed'
    await sendExamInvite(ctx, { id: account.id, email: account.email, firstname: account.firstname })
    audit('examInviteResent', { target: `quiz ${quizId}`, details: { user: userId, email: account.email } })
    return 'sent'
  } catch (e) {
    reportError('resend exam invite failed', e)
    return 'failed'
  }
}

/** Take the exam from someone (before they've taken it — results stay). */
export async function removeFromAudienceAction(quizId: number, userId: number) {
  const ctx = await managerExam(quizId)
  if (!ctx || !Number.isSafeInteger(userId)) return
  await setExamAudience(ctx.user.userId, ctx.companyId, quizId, [], [userId])
  audit('examTakerRemoved', { target: `quiz ${quizId}`, details: { user: userId } })
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
    audit('examPassersInvitedToSchool', { target: `quiz ${quizId}`, details: { invited } })
    revalidatePath(`/school/exams/${quizId}/results`)
    return { ok: true, invited }
  } catch (e) {
    reportError('invite exam takers failed', e)
    return { ok: false }
  }
}
