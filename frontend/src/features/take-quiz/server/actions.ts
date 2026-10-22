'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { childCourses, parentsOf } from '@/entities/family/server'
import { notify } from '@/entities/notification/server'
import { quizForStudent, reviewAttempt, saveAttempt, startAttempt } from '@/entities/quiz/server'
import { requireRole } from '@/entities/session/server'
import { formId } from '@/shared/lib/form'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

/** Start (or continue) a quiz → the attempt screen. */
export async function startAttemptAction(form: FormData) {
  const user = await requireRole('student')
  const quizId = formId(form, 'quizId')
  if (!quizId) return
  const attemptId = await startAttempt(user.userId, quizId)
  redirect(`/quiz/${attemptId}`)
}

export type SaveResult = { ok: true; finished: boolean; needsGrading: boolean } | { ok: false }

/**
 * Autosave ({slot: answer}) or submit. On submit: written answers → the course's teachers are told;
 * an exam graded at once → the student's parents get the result.
 */
export async function saveAnswersAction(attemptId: number, answers: Record<number, unknown>, finish: boolean): Promise<SaveResult> {
  const user = await requireRole('student')
  if (!Number.isSafeInteger(attemptId) || typeof answers !== 'object' || answers === null) return { ok: false }
  if (JSON.stringify(answers).length > 200_000) return { ok: false }
  try {
    const r = await saveAttempt(user.userId, attemptId, answers, finish)
    if (finish) audit('quizSubmitted', { target: `attempt ${attemptId}` }) // autosaves are not logged
    if (r.finished && finish) await afterSubmit(user.userId, user.name, attemptId, r.needsgrading)
    if (r.finished) revalidatePath('/', 'layout')
    return { ok: true, finished: r.finished, needsGrading: r.needsgrading }
  } catch (e) {
    reportError('save quiz answers failed', e)
    return { ok: false }
  }
}

async function afterSubmit(studentId: number, studentName: string, attemptId: number, needsGrading: boolean) {
  try {
    const review = await reviewAttempt(studentId, attemptId)
    if (!review) return
    const quiz = await quizForStudent(studentId, review.quizId)
    if (!quiz) return
    if (needsGrading) {
      const course = (await childCourses(studentId)).find((c) => c.courseId === quiz.courseId)
      await notify(course?.teachers ?? [], 'quizToGrade', { student: studentName, quiz: quiz.name }, `/courses/${quiz.courseId}/quizzes/${quiz.id}/results`)
    } else if (quiz.kind === 'exam' && review.grade !== null) {
      const parents = await parentsOf([studentId])
      await notify(parents, 'examResult', { child: studentName, quiz: quiz.name, grade: String(Math.round(review.grade)) }, '/family')
    }
  } catch (e) {
    reportError('quiz submit notifications failed', e)
  }
}
