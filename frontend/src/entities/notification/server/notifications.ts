import 'server-only'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/shared/i18n'
import { MESSAGES } from '@/shared/i18n/messages'
import { query } from '@/shared/server/db'
import { prefsOf, setPref } from '@/shared/server/user-prefs'
import { renderNotification } from '../lib/render'
import { CHANNELS } from './channels'
import type { AppNotification, NotificationKind, NotificationParams, Recipient } from '../model/types'
import { reportError } from '@/shared/server/errors'

/**
 * Notifications: a row per recipient in app-db (the bell) + every delivery channel (email today, push
 * later — see channels.ts), in the recipient's language. Deliveries are best-effort: a failure is
 * logged, never breaks the action that caused it.
 * SERVER-SIDE ONLY.
 */

/** Remember a user's UI language (used for their emails and notifications). */
export async function rememberLocale(userId: number, locale: Locale) {
  await setPref(userId, 'budu_locale', locale) // an IOMAD user preference — the mobile app reads it too
}

async function localesOf(ids: number[]): Promise<Map<number, Locale>> {
  if (!ids.length) return new Map()
  const prefs = await prefsOf(ids)
  return new Map([...prefs].filter(([, p]) => isLocale(p.locale)).map(([id, p]) => [id, p.locale as Locale]))
}

/** Notify people (bell + email). Duplicate recipients are sent once. */
export async function notify(recipients: Recipient[], kind: NotificationKind, params: NotificationParams, link: string | null) {
  const unique = [...new Map(recipients.map((r) => [r.id, r])).values()]
  if (!unique.length) return
  await query(
    `INSERT INTO notifications (iomad_user_id, kind, params, link)
     SELECT unnest($1::int[]), $2, $3::jsonb, $4`,
    [unique.map((r) => r.id), kind, JSON.stringify(params), link],
  )
  const locales = await localesOf(unique.map((r) => r.id))
  await Promise.all(
    unique.map(async (recipient) => {
      const locale = locales.get(recipient.id) ?? DEFAULT_LOCALE
      const { title, body } = renderNotification(MESSAGES[locale], kind, params)
      const delivery = { recipient, locale, title, body, link: link ?? '/' }
      for (const channel of CHANNELS) {
        try {
          await channel.send(delivery)
        } catch (e) {
          reportError(`notification ${channel.name} to user ${recipient.id} failed`, e)
        }
      }
    }),
  )
}

type Row = { id: string; kind: NotificationKind; params: NotificationParams; link: string | null; created: number; read_at: Date | null }

export async function listNotifications(userId: number, limit = 20): Promise<AppNotification[]> {
  const rows = await query<Row>(
    `SELECT id, kind, params, link, extract(epoch FROM created_at)::int AS created, read_at
       FROM notifications WHERE iomad_user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  )
  return rows.map((r) => ({ id: Number(r.id), kind: r.kind, params: r.params, link: r.link, createdAt: r.created, read: !!r.read_at }))
}

export async function unreadCount(userId: number) {
  const [row] = await query<{ n: number }>(`SELECT count(*)::int AS n FROM notifications WHERE iomad_user_id = $1 AND read_at IS NULL`, [userId])
  return row?.n ?? 0
}

/** Mark one (id) or all of the user's notifications read. */
export async function markRead(userId: number, id?: number) {
  if (id) await query(`UPDATE notifications SET read_at = now() WHERE iomad_user_id = $1 AND id = $2 AND read_at IS NULL`, [userId, id])
  else await query(`UPDATE notifications SET read_at = now() WHERE iomad_user_id = $1 AND read_at IS NULL`, [userId])
}
