'use server'

import { revalidatePath } from 'next/cache'
import { parentsOf } from '@/entities/family/server'
import { notify } from '@/entities/notification/server'
import { getQuiz, gradeAnswer, teacherReview } from '@/entities/quiz/server'
import { requireRole } from '@/entities/session/server'
import { getUserById } from '@/entities/user/server'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

/**
 * Teacher grades one answer. When the attempt has nothing left to grade, the student (and, for an exam,
 * their parents) get the result. Returns an error key or null.
 */
export async function gradeAnswerAction(attemptId: number, slot: number, mark: number, comment: string): Promise<'invalid' | 'server' | null> {
  const user = await requireRole('teacher', 'manager')
  if (!Number.isSafeInteger(attemptId) || !Number.isSafeInteger(slot) || !Number.isFinite(mark) || mark < 0) return 'invalid'
  try {
    const r = await gradeAnswer(user.userId, attemptId, slot, mark, String(comment ?? '').slice(0, 5000))
    audit('answerGraded', { target: `attempt ${attemptId}`, details: { question: slot, mark } })
    if (!r.needsgrading) {
      const [review, student] = await Promise.all([teacherReview(user.userId, attemptId), getUserById(r.studentid)])
      const quiz = review ? await getQuiz(user.userId, review.quizId) : null
      if (review && quiz && student) {
        const grade = String(Math.round(review.grade ?? 0))
        await notify([student], 'quizGraded', { quiz: quiz.name, grade }, `/quiz/${attemptId}/review`)
        if (quiz.kind === 'exam') {
          await notify(await parentsOf([student.id]), 'examResult', { child: student.name, quiz: quiz.name, grade }, '/family')
        }
      }
    }
  } catch (e) {
    reportError('grade answer failed', e)
    return 'server'
  }
  revalidatePath('/courses', 'layout')
  return null
}
