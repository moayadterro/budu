'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { query } from '@/shared/server/db'
import { sendMail } from '@/shared/server/mailer'
import { getLocale } from '@/shared/i18n/server'
import { CONTACT_TOPICS, type ContactTopic } from '../model/topics'

export type ContactState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; error: 'invalid' | 'tooMany' | 'server' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PER_HOUR = 5

/**
 * The public Contact form (no account needed). Stored in app-db (`contact_messages`) and emailed to
 * CONTACT_EMAIL when set. Anti-abuse: a hidden "website" field bots fill in, and at most 5 messages
 * an hour per IP (only its hash is kept).
 */
export async function sendContactAction(_prev: ContactState, form: FormData): Promise<ContactState> {
  const text = (k: string) => String(form.get(k) ?? '').trim()
  if (text('website')) return { status: 'sent' } // a bot: pretend it worked
  const name = text('name').slice(0, 100)
  const email = text('email').slice(0, 200)
  const topic = text('topic') as ContactTopic
  const message = text('message').slice(0, 4000)
  if (!name || !EMAIL.test(email) || !CONTACT_TOPICS.includes(topic) || message.length < 10) return { status: 'error', error: 'invalid' }

  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex')
  try {
    const [{ n }] = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM contact_messages WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'`,
      [ipHash],
    )
    if (n >= PER_HOUR) return { status: 'error', error: 'tooMany' }
    const locale = await getLocale()
    await query(`INSERT INTO contact_messages (name, email, topic, message, locale, ip_hash) VALUES ($1, $2, $3, $4, $5, $6)`, [
      name,
      email,
      topic,
      message,
      locale,
      ipHash,
    ])
    const to = process.env.CONTACT_EMAIL
    if (to) {
      const body = `${message}\n\n— ${name} <${email}> · ${topic} · ${locale}`
      await sendMail({ to, subject: `[Budu · ${topic}] ${name}`, text: body, html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(body)}</pre>` }).catch(
        (e) => console.error('contact email failed', e),
      )
    }
  } catch (e) {
    console.error('contact form failed', e)
    return { status: 'error', error: 'server' }
  }
  return { status: 'sent' }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
