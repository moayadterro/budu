import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance, iomadCall } from '@/shared/server/iomad'
import { NO_RATING, type Rating, type RatingAsk, type Review } from '../model/types'

/**
 * Course ratings in app-db (`course_reviews`; `course_finishes` only remembers "Not now"). Whether a
 * student FINISHED a course is IOMAD's record — Moodle course completion — so the mobile API sees it
 * too. Callers check the student is in the course before recording anything. SERVER-SIDE ONLY.
 */

const url = () => defaultInstance().url

/** Average stars + number of reviews per course (courses without reviews: 5.0, 0). */
export async function ratingsFor(courseIds: number[]): Promise<Map<number, Rating>> {
  const out = new Map(courseIds.map((id) => [id, NO_RATING]))
  if (!courseIds.length) return out
  const rows = await query<{ course_id: number; average: string; count: string }>(
    `SELECT course_id, avg(stars) AS average, count(*) AS count FROM course_reviews
      WHERE iomad_url = $1 AND course_id = ANY($2::int[]) GROUP BY course_id`,
    [url(), courseIds],
  )
  for (const r of rows) out.set(r.course_id, { average: Number(r.average), count: Number(r.count) })
  return out
}

/** The newest reviews that say something (with a comment). */
export async function recentReviews(courseId: number, limit = 3): Promise<Review[]> {
  const rows = await query<{ author_name: string; stars: number; comment: string; at: number }>(
    `SELECT author_name, stars, comment, extract(epoch FROM updated_at)::int AS at FROM course_reviews
      WHERE iomad_url = $1 AND course_id = $2 AND comment <> '' ORDER BY updated_at DESC LIMIT $3`,
    [url(), courseId, limit],
  )
  return rows.map((r) => ({ authorName: r.author_name, stars: r.stars, comment: r.comment, at: r.at }))
}

/** The student reached the end of the course (opened its last lesson) → Moodle course completion. Idempotent. */
export async function markFinished(userId: number, courseId: number) {
  await iomadCall(defaultInstance(), 'local_budu_complete_course', { courseid: courseId, userid: userId })
}

/** Has the student completed the course (Moodle course completion)? */
async function finished(userId: number, courseId: number): Promise<boolean> {
  const rows = await iomadCall<Array<{ courseid: number }>>(defaultInstance(), 'local_budu_completed_courses', { userid: userId, courseids: [courseId] })
  return rows.some((r) => r.courseid === courseId)
}

export async function ratingAsk(userId: number, courseId: number): Promise<RatingAsk> {
  const [done, [f], [r]] = await Promise.all([
    finished(userId, courseId),
    query<{ dismissed: boolean }>(
      `SELECT dismissed_at IS NOT NULL AS dismissed FROM course_finishes WHERE iomad_url = $1 AND course_id = $2 AND user_id = $3`,
      [url(), courseId, userId],
    ),
    query<{ stars: number; comment: string }>(
      `SELECT stars, comment FROM course_reviews WHERE iomad_url = $1 AND course_id = $2 AND user_id = $3`,
      [url(), courseId, userId],
    ),
  ])
  return { finished: done, dismissed: !!f?.dismissed, mine: r ? { stars: r.stars, comment: r.comment } : null }
}

/** "Not now": stop asking (the student can still rate from the course page). */
export async function dismissAsk(userId: number, courseId: number) {
  await query(
    `INSERT INTO course_finishes (iomad_url, course_id, user_id, dismissed_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (iomad_url, course_id, user_id) DO UPDATE SET dismissed_at = now()`,
    [url(), courseId, userId],
  )
}

/** Save (or change) the student's rating. */
export async function saveReview(userId: number, courseId: number, r: { authorName: string; stars: number; comment: string }) {
  await query(
    `INSERT INTO course_reviews (iomad_url, course_id, user_id, author_name, stars, comment) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (iomad_url, course_id, user_id) DO UPDATE
       SET author_name = EXCLUDED.author_name, stars = EXCLUDED.stars, comment = EXCLUDED.comment, updated_at = now()`,
    [url(), courseId, userId, r.authorName, r.stars, r.comment],
  )
}
