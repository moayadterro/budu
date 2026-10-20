'use server'

import { revalidatePath } from 'next/cache'
import { enrolStudent, unenrolStudent, type EnrolResult } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'

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
    if (result === 'enrolled') revalidatePath('/', 'layout')
    return { status: result, at: Date.now() }
  } catch (e) {
    console.error('enrol student failed', e)
    return { status: 'server', at: Date.now() }
  }
}

export async function removeStudentAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const studentId = formId(form, 'studentId')
  if (!courseId || !studentId) return
  await unenrolStudent(user.userId, courseId, studentId)
  revalidatePath('/', 'layout')
}
