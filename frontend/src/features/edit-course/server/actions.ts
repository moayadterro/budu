'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { COURSE_LIMITS } from '@/entities/course'
import { createCourse, updateCourse } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'
import type { CourseFormError, CourseFormState } from '../model/types'

function readDetails(form: FormData): { title: string; description: string } | CourseFormError {
  const title = formText(form, 'title')
  const description = formText(form, 'description')
  if (!title) return 'invalid'
  if (title.length > COURSE_LIMITS.title || description.length > COURSE_LIMITS.text) return 'tooLong'
  return { title, description }
}

/** Creates a draft course in the teacher's tenant, then opens it in the builder. */
export async function createCourseAction(_prev: CourseFormState, form: FormData): Promise<CourseFormState> {
  const user = await requireRole('teacher')
  const details = readDetails(form)
  if (typeof details === 'string') return { status: 'error', error: details }
  if (!user.companyId) return { status: 'error', error: 'server' }

  let id: number
  try {
    id = await createCourse(user.userId, user.companyId, details.title, details.description)
  } catch (e) {
    console.error('create course failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath('/courses')
  redirect(`/courses/${id}`)
}

/** Saves title + description; `published` comes along unchanged as a hidden field. */
export async function saveCourseDetails(_prev: CourseFormState, form: FormData): Promise<CourseFormState> {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const details = readDetails(form)
  if (!courseId) return { status: 'error', error: 'invalid' }
  if (typeof details === 'string') return { status: 'error', error: details }
  try {
    await updateCourse(user.userId, courseId, { ...details, published: formText(form, 'published') === '1' })
  } catch (e) {
    console.error('save course failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath(`/courses/${courseId}`)
  return { status: 'saved' }
}

/** Publish / unpublish (course visible to its enrolled students or not). */
export async function setCoursePublished(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const details = readDetails(form)
  if (!courseId || typeof details === 'string') return
  await updateCourse(user.userId, courseId, { ...details, published: formText(form, 'published') === '1' })
  revalidatePath(`/courses/${courseId}`)
  revalidatePath('/courses')
}
