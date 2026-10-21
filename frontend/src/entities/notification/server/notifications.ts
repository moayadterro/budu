import 'server-only'
import { DEFAULT_LOCALE, dirOf, isLocale, type Locale } from '@/shared/i18n'
import { MESSAGES } from '@/shared/i18n/messages'
import { query } from '@/shared/server/db'
import { composeMail } from '@/shared/server/mail-layout'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { renderNotification } from '../lib/render'
import type { AppNotification, NotificationKind, NotificationParams, Recipient } from '../model/types'

/**
 * Notifications: a row per recipient in app-db (the bell) + an email in the recipient's language.
 * Emails are best-effort — a mail failure is logged, never breaks the action that caused it.
 * SERVER-SIDE ONLY.
 */

/** Remember a user's UI language (used for their emails and notifications). */
export async function rememberLocale(userId: number, locale: Locale) {
  await query(
    `INSERT INTO user_prefs (iomad_user_id, locale) VALUES ($1, $2)
     ON CONFLICT (iomad_user_id) DO UPDATE SET locale = EXCLUDED.locale, updated_at = now()`,
    [userId, locale],
  )
}

async function localesOf(ids: number[]): Promise<Map<number, Locale>> {
  if (!ids.length) return new Map()
  const rows = await query<{ iomad_user_id: number; locale: string | null }>(
    `SELECT iomad_user_id, locale FROM user_prefs WHERE iomad_user_id = ANY($1::int[])`,
    [ids],
  )
  return new Map(rows.filter((r) => isLocale(r.locale)).map((r) => [r.iomad_user_id, r.locale as Locale]))
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
    unique.map(async (r) => {
      if (!r.email) return
      const locale = locales.get(r.id) ?? DEFAULT_LOCALE
      const t = MESSAGES[locale]
      const { title, body } = renderNotification(t, kind, params)
      try {
        await sendMail({
          to: r.email,
          subject: title,
          ...composeMail(t, dirOf(locale), {
            name: r.name.split(' ')[0] || r.name,
            body,
            action: t.notify.open,
            link: appUrl(link ?? '/'),
            footer: t.notify.emailFooter,
          }),
        })
      } catch (e) {
        console.error(`notification email to user ${r.id} failed`, e)
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
