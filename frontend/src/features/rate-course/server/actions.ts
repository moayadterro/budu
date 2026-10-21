'use server'

import { revalidatePath } from 'next/cache'
import { getCourse } from '@/entities/course/server'
import { REVIEW_LIMITS } from '@/entities/review'
import { dismissAsk, ratingAsk, saveReview } from '@/entities/review/server'
import { requireRole } from '@/entities/session/server'
import { formId, formText } from '@/shared/lib/form'

export type RateState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; at: number }

/** A student rates a course they're in and have finished (1–5 stars, optional comment). */
export async function rateCourseAction(_prev: RateState, form: FormData): Promise<RateState> {
  const user = await requireRole('student')
  const at = Date.now()
  const courseId = formId(form, 'courseId')
  const stars = formId(form, 'stars')
  const comment = formText(form, 'comment').slice(0, REVIEW_LIMITS.comment)
  if (!courseId || stars < 1 || stars > 5) return { status: 'error', at }
  // in the course (IOMAD) and reached its end
  const [course, ask] = await Promise.all([getCourse(user.userId, courseId), ratingAsk(user.userId, courseId)])
  if (!course || !ask.finished) return { status: 'error', at }
  await saveReview(user.userId, courseId, { authorName: user.name, stars, comment })
  revalidatePath(`/classes/${courseId}`)
  revalidatePath(`/explore/${courseId}`)
  return { status: 'saved', at }
}

/** "Not now" — stop asking on the course page. */
export async function dismissRatingAction(form: FormData) {
  const user = await requireRole('student')
  const courseId = formId(form, 'courseId')
  if (!courseId) return
  await dismissAsk(user.userId, courseId)
  revalidatePath(`/classes/${courseId}`)
}
