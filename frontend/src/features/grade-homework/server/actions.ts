'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSubmission, gradeSubmission } from '@/entities/homework/server'
import { notify } from '@/entities/notification/server'
import { getGradeScale } from '@/entities/tenant/server'
import { formatGrade } from '@/shared/lib/grade-scale'
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
    const value = Math.round(grade * 10) / 10
    await gradeSubmission(user.userId, homeworkId, studentId, value, feedback)
    const sub = await getSubmission(user.userId, homeworkId, studentId)
    if (sub) {
      const scale = await getGradeScale(user.companyId)
      await notify(
        [{ id: sub.student.id, email: sub.student.email, name: sub.student.name }],
        'homeworkGraded',
        { homework: sub.homeworkTitle, course: sub.courseTitle, grade: formatGrade(value, scale) },
        `/classes/${sub.courseId}/homework/${homeworkId}`,
      )
    }
  } catch (e) {
    console.error('grade failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath('/', 'layout')
  const next = formText(form, 'next') || formText(form, 'here')
  if (next.startsWith('/grading')) redirect(next)
  return { status: 'saved', at: Date.now() }
}
