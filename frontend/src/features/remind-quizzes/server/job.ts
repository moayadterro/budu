import 'server-only'
import { notify } from '@/entities/notification/server'
import { parentsOf } from '@/entities/family/server'
import { closingSoon, openingNow } from '@/entities/quiz/server'
import { query } from '@/shared/server/db'
import { defaultInstance } from '@/shared/server/iomad'
import { reportError } from '@/shared/server/errors'

/**
 * Quiz chores, run at most every few minutes per server process, triggered after page responses (no
 * separate scheduler yet):
 *  - announce quizzes whose scheduled publish time has come (students; for exams their parents too);
 *  - remind students of quizzes closing within 24 hours that they haven't started.
 * Each is claimed in app-db first, so it's sent once. SERVER-SIDE ONLY.
 */
const EVERY_MS = 2 * 60 * 1000
const g = globalThis as unknown as { __buduQuizReminders?: { last: number; running: boolean } }

export async function runQuizReminders() {
  const state = (g.__buduQuizReminders ??= { last: 0, running: false })
  if (state.running || Date.now() - state.last < EVERY_MS) return
  state.running = true
  state.last = Date.now()
  try {
    const now = Math.floor(Date.now() / 1000)
    for (const q of await openingNow(now - 2 * 86400, now)) {
      const [claimed] = await query<{ quiz_id: number }>(
        `INSERT INTO quiz_announcements (iomad_url, quiz_id, open_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING quiz_id`,
        [defaultInstance().url, q.cmid, q.publishAt],
      )
      if (!claimed) continue
      const params = { course: q.coursename, quiz: q.name, kind: q.kind }
      await notify(q.students, 'quizPublished', params, `/classes/${q.courseid}/quizzes/${q.cmid}`)
      if (q.kind === 'exam') await notify(await parentsOf(q.students.map((s) => s.id)), 'quizPublished', params, '/family')
    }
    for (const q of await closingSoon(now, now + 24 * 3600)) {
      // claim the reminders first, so two servers never send the same one
      const claimed = await query<{ user_id: number }>(
        `INSERT INTO quiz_reminders (iomad_url, quiz_id, user_id) SELECT $1, $2, unnest($3::int[])
         ON CONFLICT DO NOTHING RETURNING user_id`,
        [defaultInstance().url, q.cmid, q.students.map((s) => s.id)],
      )
      const ids = new Set(claimed.map((r) => r.user_id))
      const recipients = q.students.filter((s) => ids.has(s.id))
      if (recipients.length) {
        await notify(recipients, 'quizReminder', { quiz: q.name, course: q.coursename, kind: q.kind }, `/classes/${q.courseid}/quizzes/${q.cmid}`)
      }
    }
  } catch (e) {
    reportError('quiz reminders failed', e)
  } finally {
    state.running = false
  }
}
