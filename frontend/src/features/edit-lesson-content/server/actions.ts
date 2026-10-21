'use server'

import { revalidatePath } from 'next/cache'
import { COURSE_LIMITS } from '@/entities/course'
import { deleteLessonItem, getCourse, listStudents, savePage, saveTask } from '@/entities/course/server'
import { notify } from '@/entities/notification/server'
import { requireRole } from '@/entities/session/server'
import { MAX_UPLOAD_BYTES } from '@/shared/config/upload'
import { formFile, formId, formText } from '@/shared/lib/form'
import type { ContentFormState } from '../model/types'

const saved = (): ContentFormState => ({ status: 'saved', at: Date.now() })
const fail = (error: Extract<ContentFormState, { status: 'error' }>['error']): ContentFormState => ({ status: 'error', error })

/** Adds a task to a lesson, or edits one (taskId). An attached file replaces the current one. */
export async function saveTaskAction(_prev: ContentFormState, form: FormData): Promise<ContentFormState> {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const lessonId = formId(form, 'lessonId')
  const taskId = formId(form, 'taskId')
  const name = formText(form, 'name')
  const instructions = formText(form, 'instructions')
  const dueAt = formId(form, 'dueAt') || null // unix seconds, set by the browser from its local time
  const file = formFile(form, 'file')
  if (!courseId || !lessonId || !name) return fail('invalid')
  if (name.length > COURSE_LIMITS.title || instructions.length > COURSE_LIMITS.text) return fail('tooLong')
  if (file && file.size > MAX_UPLOAD_BYTES) return fail('tooBig')
  try {
    const saved = await saveTask(user.userId, courseId, lessonId, taskId, { name, instructions, dueAt, file })
    if (!taskId) {
      // new homework → tell the course's students (only once the course is published)
      const course = await getCourse(user.userId, courseId)
      if (course?.published) {
        const students = await listStudents(user.userId, courseId)
        await notify(
          students.map((s) => ({ id: s.id, email: s.email, name: s.name })),
          'homeworkNew',
          { course: course.title, homework: name },
          `/classes/${courseId}/homework/${saved.id}`,
        )
      }
    }
  } catch (e) {
    console.error('save task failed', e)
    return fail('server')
  }
  revalidatePath(`/courses/${courseId}`)
  return saved()
}

/** Adds a text page to a lesson, or edits one (pageId). IOMAD cleans the HTML (no scripts / unsafe links). */
export async function saveTextAction(_prev: ContentFormState, form: FormData): Promise<ContentFormState> {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const lessonId = formId(form, 'lessonId')
  const pageId = formId(form, 'pageId')
  const name = formText(form, 'name')
  const html = String(form.get('html') ?? '')
  if (!courseId || !lessonId || !name) return fail('invalid')
  if (name.length > COURSE_LIMITS.title || html.length > COURSE_LIMITS.page) return fail('tooLong')
  try {
    await savePage(user.userId, courseId, lessonId, pageId, { name, html })
  } catch (e) {
    console.error('save text failed', e)
    return fail('server')
  }
  revalidatePath(`/courses/${courseId}`)
  return saved()
}

export async function deleteItemAction(form: FormData) {
  const user = await requireRole('teacher')
  const courseId = formId(form, 'courseId')
  const itemId = formId(form, 'itemId')
  if (!courseId || !itemId) return
  await deleteLessonItem(user.userId, courseId, itemId)
  revalidatePath(`/courses/${courseId}`)
}
