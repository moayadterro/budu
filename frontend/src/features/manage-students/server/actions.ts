'use server'

import { revalidatePath } from 'next/cache'
import { enrolStudent, getCourse, unenrolStudent, type EnrolResult } from '@/entities/course/server'
import { notify } from '@/entities/notification/server'
import { getAccount } from '@/entities/user/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

export type EnrolState = { status: 'idle' } | { status: EnrolResult | 'invalid' | 'server'; at: number }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Adds an existing Budu account (by email) to a course the teacher teaches. */
export async function enrolStudentAction(_prev: EnrolState, form: FormData): Promise<EnrolState> {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const email = formText(form, 'email').toLowerCase()
  if (!courseId || !EMAIL.test(email) || email.length > 254) return { status: 'invalid', at: Date.now() }
  try {
    const result = await enrolStudent(user.userId, courseId, email)
    audit('studentEnrolled', { target: `course ${courseId}`, details: { email, result: typeof result === 'string' ? result : 'ok' } })
    if (result === 'enrolled') {
      const [account, course] = await Promise.all([getAccount(email), getCourse(user.userId, courseId)])
      if (account.found && course) {
        await notify(
          [{ id: account.id, email: account.email, name: `${account.firstname} ${account.lastname}`.trim() }],
          'enrolled',
          { course: course.title, by: user.name },
          `/classes/${courseId}`,
        )
      }
      revalidatePath('/', 'layout')
    }
    return { status: result, at: Date.now() }
  } catch (e) {
    reportError('enrol student failed', e)
    return { status: 'server', at: Date.now() }
  }
}

export async function removeStudentAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const studentId = formId(form, 'studentId')
  if (!courseId || !studentId) return
  await unenrolStudent(user.userId, courseId, studentId)
  audit('studentUnenrolled', { target: `course ${courseId}`, details: { student: studentId } })
  revalidatePath('/', 'layout')
}
