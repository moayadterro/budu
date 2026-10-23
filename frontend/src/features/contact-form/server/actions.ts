'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { query } from '@/shared/server/db'
import { sendMail } from '@/shared/server/mailer'
import { getLocale, messagesFor } from '@/shared/i18n/server'
import { LANGUAGES } from '@/shared/i18n'
import { composeMail } from '@/shared/server/mail-layout'
import { CONTACT_TOPICS, type ContactTopic } from '../model/topics'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

export type ContactState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; error: 'invalid' | 'tooMany' | 'server' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PER_HOUR = 5

/**
 * The public Contact form (no account needed). Stored in app-db (`contact_messages`) and emailed to
 * the team at CONTACT_EMAIL (.env; empty = only stored) in our usual layout, in English, with
 * Reply-To = the visitor, so "Reply" in the inbox answers them, not no-reply. Anti-abuse: a hidden "website" field bots fill in, and at most 5 messages
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
    audit('contactMessage', { details: { topic, name, email } })
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
      const t = messagesFor('en') // the team's email is in English (like the other admin emails)
      const c = t.email.contactTeam
      const topicName = t.site.contact.topics[topic]
      const reply = `mailto:${email}?subject=${encodeURIComponent(`Re: ${topicName}`)}`
      await sendMail({
        to,
        replyTo: `${name.replace(/[<>"\r\n]/g, '')} <${email}>`,
        subject: c.subject(topicName, name),
        ...composeMail(t, 'ltr', {
          title: c.title,
          name: c.name,
          body: `${c.body}\n\n${message}`,
          details: [
            { label: c.details.name, value: name },
            { label: c.details.email, value: email },
            { label: c.details.topic, value: topicName },
            { label: c.details.language, value: LANGUAGES.find((l) => l.code === locale)?.name ?? locale },
          ],
          action: c.action,
          link: reply,
        }),
      }).catch((e) => reportError('contact email failed', e))
    }
  } catch (e) {
    reportError('contact form failed', e)
    return { status: 'error', error: 'server' }
  }
  return { status: 'sent' }
}

