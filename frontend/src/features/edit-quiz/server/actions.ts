'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCourse } from '@/entities/course/server'
import { parentsOf } from '@/entities/family/server'
import { notify } from '@/entities/notification/server'
import { QUESTION_TYPES, type QuestionData, type QuizKind } from '@/entities/quiz'
import { deleteQuiz, getQuiz, moveQuestion, publishQuiz, quizResults, saveQuestion, saveQuiz } from '@/entities/quiz/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'

export type QuizFormState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: 'invalid' | 'dates' | 'server'; at: number }

const LIMITS = { name: 200, intro: 5000, text: 5000, timeLimitMin: 600 }

/** Where the quiz screens live: a course's quizzes or the school's exams (never an arbitrary URL). */
const baseOf = (form: FormData, courseId: number) => {
  const base = formText(form, 'base')
  return base === '/school/exams' || base === `/courses/${courseId}/quizzes` ? base : `/courses/${courseId}/quizzes`
}

/** Create (→ the editor) or change a quiz's settings. The close time comes from the browser (its local time → unix). */
export async function saveQuizAction(_prev: QuizFormState, form: FormData): Promise<QuizFormState> {
  const user = await requireRole('teacher', 'manager')
  const at = Date.now()
  const courseId = formId(form, 'courseId')
  const quizId = formId(form, 'quizId')
  const name = formText(form, 'name').slice(0, LIMITS.name)
  const kind: QuizKind = formText(form, 'kind') === 'exam' ? 'exam' : 'quiz'
  const closesAt = formId(form, 'closesAt') || null
  const minutes = Number(formText(form, 'timeLimit') || 0)
  const passMark = Number(formText(form, 'passMark') || 0)
  const classIds = form.getAll('classIds').map(Number).filter((n) => Number.isSafeInteger(n) && n > 0)
  if (!courseId || !name || !Number.isFinite(minutes) || minutes < 0 || minutes > LIMITS.timeLimitMin || !(passMark >= 0 && passMark <= 100)) {
    return { status: 'error', error: 'invalid', at }
  }
  if (closesAt && closesAt <= Math.floor(Date.now() / 1000)) return { status: 'error', error: 'dates', at }
  let id: number
  try {
    id = await saveQuiz(user.userId, courseId, quizId, {
      name,
      intro: formText(form, 'intro').slice(0, LIMITS.intro),
      kind,
      closesAt,
      timeLimit: Math.round(minutes * 60),
      passMark,
      classIds,
    })
  } catch (e) {
    console.error('save quiz failed', e)
    return { status: 'error', error: 'server', at }
  }
  const base = baseOf(form, courseId)
  revalidatePath(base, 'layout')
  if (!quizId) redirect(`${base}/${id}`)
  return { status: 'saved', at }
}

/**
 * Publish now (students — and for exams their parents — are told at once), schedule publishing for
 * `publishAt` (hidden until then; they're told then), or hide. Returns an error key, or null.
 */
export async function publishQuizAction(quizId: number, published: boolean, publishAt: number | null = null): Promise<'empty' | 'dates' | 'server' | null> {
  const user = await requireRole('teacher', 'manager')
  const quiz = await getQuiz(user.userId, quizId)
  if (!quiz) return 'server'
  if (published && quiz.questions.length === 0) return 'empty'
  const now = Math.floor(Date.now() / 1000)
  const at = published && publishAt && Number.isSafeInteger(publishAt) && publishAt > now ? publishAt : null
  if (at && quiz.closesAt && quiz.closesAt <= at) return 'dates'
  const wasLive = quiz.published && !(quiz.opensAt && quiz.opensAt > now)
  try {
    await publishQuiz(user.userId, quizId, published, at)
    if (published && !at && !wasLive) {
      const [course, results] = await Promise.all([getCourse(user.userId, quiz.courseId), quizResults(user.userId, quizId)])
      const students = results?.students ?? []
      const params = { course: course?.title ?? '', quiz: quiz.name, kind: quiz.kind }
      await notify(students, 'quizPublished', params, `/classes/${quiz.courseId}/quizzes/${quizId}`)
      if (quiz.kind === 'exam') {
        const parents = await parentsOf(students.map((s) => s.id))
        await notify(parents, 'quizPublished', params, '/family')
      }
    }
  } catch (e) {
    console.error('publish quiz failed', e)
    return 'server'
  }
  revalidatePath('/', 'layout')
  return null
}

export async function deleteQuizAction(form: FormData) {
  const user = await requireRole('teacher', 'manager')
  const quizId = formId(form, 'quizId')
  const courseId = formId(form, 'courseId')
  if (!quizId || !courseId) return
  await deleteQuiz(user.userId, quizId)
  const base = baseOf(form, courseId)
  revalidatePath(base, 'layout')
  redirect(base)
}

export type QuestionInput = { text: string; mark: number; data: QuestionData & { explanation?: string } }

/** Add (slot 0) or change a question. Returns an error key, or null. IOMAD validates the details too. */
export async function saveQuestionAction(quizId: number, slot: number, q: QuestionInput): Promise<'invalid' | 'server' | null> {
  const user = await requireRole('teacher', 'manager')
  const text = String(q?.text ?? '').trim()
  const mark = Number(q?.mark)
  if (!Number.isSafeInteger(quizId) || !Number.isSafeInteger(slot) || !text || text.length > LIMITS.text) return 'invalid'
  if (!(mark > 0 && mark <= 100) || !QUESTION_TYPES.includes(q?.data?.type)) return 'invalid'
  if (JSON.stringify(q.data).length > 50_000) return 'invalid'
  try {
    await saveQuestion(user.userId, quizId, slot, { text, mark, data: q.data })
  } catch (e) {
    console.error('save question failed', e)
    return 'server'
  }
  revalidatePath('/', 'layout')
  return null
}

/** Remove (0) or move a question up (−1) / down (1). */
export async function moveQuestionAction(quizId: number, slot: number, direction: -1 | 0 | 1) {
  const user = await requireRole('teacher', 'manager')
  if (!Number.isSafeInteger(quizId) || !Number.isSafeInteger(slot) || ![-1, 0, 1].includes(direction)) return
  await moveQuestion(user.userId, quizId, slot, direction)
  revalidatePath('/', 'layout')
}
