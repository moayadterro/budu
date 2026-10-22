import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance } from '@/shared/server/iomad'

/**
 * Claim "you haven't started the exam" reminders: returns the people who may get one now (not
 * reminded in the last hour). Claiming first means two servers never send the same reminder.
 */
export async function claimExamNudges(quizId: number, userIds: number[]): Promise<number[]> {
  if (!userIds.length) return []
  const rows = await query<{ user_id: number }>(
    `INSERT INTO exam_nudges (iomad_url, quiz_id, user_id) SELECT $1, $2, unnest($3::int[])
     ON CONFLICT (iomad_url, quiz_id, user_id) DO UPDATE SET sent_at = now()
       WHERE exam_nudges.sent_at < now() - interval '1 hour'
     RETURNING user_id`,
    [defaultInstance().url, quizId, userIds],
  )
  return rows.map((r) => r.user_id)
}
