'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { gradeSubmission } from '@/entities/homework/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'

export type GradeState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: 'invalid' | 'server' }

/** Saves a 0–100 grade + feedback, then goes to `next` (the next answer) or `here` (this answer, graded view). */
export async function gradeAction(_prev: GradeState, form: FormData): Promise<GradeState> {
  const user = await requireRole('teacher')
  const homeworkId = formId(form, 'homeworkId')
  const studentId = formId(form, 'studentId')
  const raw = formText(form, 'grade').replace(',', '.')
  const grade = Number(raw)
  const feedback = formText(form, 'feedback').slice(0, 5000)
  if (!homeworkId || !studentId || raw === '' || !Number.isFinite(grade) || grade < 0 || grade > 100) {
    return { status: 'error', error: 'invalid' }
  }
  try {
    await gradeSubmission(user.userId, homeworkId, studentId, Math.round(grade * 10) / 10, feedback)
  } catch (e) {
    console.error('grade failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath('/', 'layout')
  const next = formText(form, 'next') || formText(form, 'here')
  if (next.startsWith('/grading')) redirect(next)
  return { status: 'saved', at: Date.now() }
}
