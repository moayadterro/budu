'use server'

import { revalidatePath } from 'next/cache'
import { addLessons, deleteSeries } from '@/entities/schedule/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'

export type LessonsState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: 'invalid' | 'tooMany' | 'server' }

const MAX_LESSONS = 200

/** Adds a weekly series. The browser sends every start (unix seconds) so local time and DST are right. */
export async function addLessonsAction(_prev: LessonsState, form: FormData): Promise<LessonsState> {
  const user = await requireRole('teacher', 'manager')
  const courseId = formId(form, 'courseId')
  const classId = formId(form, 'classId') // 0 = everyone in the course
  const minutes = Number(formText(form, 'duration'))
  let starts: number[] = []
  try {
    starts = (JSON.parse(formText(form, 'starts') || '[]') as unknown[]).map(Number).filter((n) => Number.isSafeInteger(n) && n > 0)
  } catch {
    starts = []
  }
  if (!courseId || !starts.length || !Number.isFinite(minutes) || minutes < 5 || minutes > 480) return { status: 'error', error: 'invalid' }
  if (starts.length > MAX_LESSONS) return { status: 'error', error: 'tooMany' }
  try {
    await addLessons(user.userId, courseId, classId, formText(form, 'room').slice(0, 200), Math.round(minutes * 60), starts)
  } catch (e) {
    console.error('add lessons failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath('/', 'layout')
  return { status: 'saved', at: Date.now() }
}

export async function deleteSeriesAction(form: FormData) {
  const user = await requireRole('teacher', 'manager')
  const courseId = formId(form, 'courseId')
  const seriesId = formId(form, 'seriesId')
  if (!courseId || !seriesId) return
  await deleteSeries(user.userId, courseId, seriesId)
  revalidatePath('/', 'layout')
}
