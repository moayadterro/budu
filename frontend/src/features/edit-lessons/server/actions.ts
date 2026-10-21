'use server'

import { revalidatePath } from 'next/cache'
import { COURSE_LIMITS } from '@/entities/course'
import { deleteLesson, discardChanges, moveLesson, saveLesson } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'
import type { LessonFormState } from '../model/types'

/** Adds a lesson at the end (no lessonId) or renames one. */
export async function saveLessonAction(_prev: LessonFormState, form: FormData): Promise<LessonFormState> {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const lessonId = formId(form, 'lessonId')
  const title = formText(form, 'title')
  const description = formText(form, 'description')
  if (!courseId || !title) return { status: 'error', error: 'invalid' }
  if (title.length > COURSE_LIMITS.title || description.length > COURSE_LIMITS.text) return { status: 'error', error: 'tooLong' }
  try {
    await saveLesson(user.userId, courseId, lessonId, title, description)
  } catch (e) {
    console.error('save lesson failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath(`/courses/${courseId}`)
  return { status: 'saved', at: Date.now() }
}

export async function deleteLessonAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const lessonId = formId(form, 'lessonId')
  if (!courseId || !lessonId) return
  await deleteLesson(user.userId, courseId, lessonId)
  revalidatePath(`/courses/${courseId}`)
}

export async function moveLessonAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const lessonId = formId(form, 'lessonId')
  const direction = formText(form, 'direction') === 'up' ? -1 : 1
  if (!courseId || !lessonId) return
  await moveLesson(user.userId, courseId, lessonId, direction)
  revalidatePath(`/courses/${courseId}`)
}

/** Undo one lesson's unpublished change (a new lesson is deleted; a rename / removal is forgotten). */
export async function undoLessonChangeAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const lessonId = formId(form, 'lessonId')
  if (!courseId || !lessonId) return
  await discardChanges(user.userId, courseId, { kind: 'section', id: lessonId })
  revalidatePath(`/courses/${courseId}`)
}
