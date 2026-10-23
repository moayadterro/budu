'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { COURSE_LIMITS } from '@/entities/course'
import { createCourse, setCourseLanguage, setCourseSubject, discardChanges, getCourse, listStudents, publishChanges, saveListing, setCourseImage, updateCourse } from '@/entities/course/server'
import { notify } from '@/entities/notification/server'
import { isCurrency } from '@/shared/config/currency'
import { isCourseLanguage } from '@/shared/config/course-language'
import { isCourseSubject } from '@/shared/config/course-subject'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'
import type { CourseFormError, CourseFormState } from '../model/types'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

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
    audit('courseCreated', { target: `course ${id}`, details: { title: details.title } })
  } catch (e) {
    reportError('create course failed', e)
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
  audit(formText(form, 'published') === '1' ? 'coursePublished' : 'courseUnpublished', { target: `course ${courseId}`, details: { title: details.title } })
  } catch (e) {
    reportError('save course failed', e)
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

/** "Publish changes": the published course's pending edits go live; students hear about new homework. */
export async function publishChangesAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  if (!courseId) return
  const tasks = await publishChanges(user.userId, courseId)
  audit('courseChangesPublished', { target: `course ${courseId}` })
  if (tasks.length) {
    const [course, students] = await Promise.all([getCourse(user.userId, courseId), listStudents(user.userId, courseId)])
    for (const task of tasks) {
      await notify(
        students.map((s) => ({ id: s.id, email: s.email, name: s.name })),
        'homeworkNew',
        { course: course?.title ?? '', homework: task.name },
        `/classes/${courseId}/homework/${task.id}`,
      )
    }
  }
  revalidatePath(`/courses/${courseId}`)
}

/** "Discard changes": back to the published version. */
export async function discardChangesAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  if (!courseId) return
  await discardChanges(user.userId, courseId)
  revalidatePath(`/courses/${courseId}`)
}

export type ListingState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; at: number }

const MAX_PRICE = 100_000_000

/** Teacher lists the course in Explore (or not) with a price in a currency; empty / 0 = free. */
export async function saveListingAction(_prev: ListingState, form: FormData): Promise<ListingState> {
  const user = await requireRole('teacher')
  const at = Date.now()
  const courseId = formId(form, 'courseId')
  const raw = formText(form, 'price').replace(',', '.')
  const price = raw === '' ? 0 : Math.round(Number(raw) * 100) / 100
  const currency = formText(form, 'currency')
  if (!courseId || !Number.isFinite(price) || price < 0 || price > MAX_PRICE || !isCurrency(currency)) return { status: 'error', at }
  const course = await getCourse(user.userId, courseId)
  if (!course?.canEdit) return { status: 'error', at }
  const language = formText(form, 'language')
  await saveListing(user.userId, { courseId, listed: form.get('listed') === 'on', price, currency })
  audit('courseListingSaved', { target: `course ${courseId}`, details: { listed: form.get('listed') === 'on', price, currency } })
  await setCourseLanguage(user.userId, courseId, isCourseLanguage(language) ? language : '') // an IOMAD course field
  const subject = formText(form, 'subject')
  await setCourseSubject(user.userId, courseId, isCourseSubject(subject) ? subject : '') // an IOMAD course field
  revalidatePath(`/courses/${courseId}`)
  revalidatePath('/explore')
  return { status: 'saved', at }
}

export type CoverState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: 'notImage' | 'tooBig' | 'server'; at: number }

const COVER_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const COVER_MAX_BYTES = 5 * 1024 * 1024

/** Teacher sets (file "cover") or removes (remove=1) the course's cover image. */
export async function setCourseCoverAction(_prev: CoverState, form: FormData): Promise<CoverState> {
  const user = await requireRole('teacher')
  const at = Date.now()
  const courseId = formId(form, 'courseId')
  const remove = form.get('remove') === '1'
  const file = form.get('cover')
  const image = file instanceof File && file.size > 0 ? file : null
  if (!courseId || (!remove && !image)) return { status: 'error', error: 'notImage', at }
  if (image && !COVER_TYPES.includes(image.type)) return { status: 'error', error: 'notImage', at }
  if (image && image.size > COVER_MAX_BYTES) return { status: 'error', error: 'tooBig', at }
  try {
    await setCourseImage(user.userId, courseId, remove ? null : image)
  } catch (e) {
    reportError('course cover failed', e)
    return { status: 'error', error: 'server', at }
  }
  revalidatePath('/', 'layout')
  return { status: 'saved', at }
}
