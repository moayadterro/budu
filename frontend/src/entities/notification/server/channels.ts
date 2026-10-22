import 'server-only'
import { dirOf, type Locale } from '@/shared/i18n'
import { MESSAGES } from '@/shared/i18n/messages'
import { composeMail } from '@/shared/server/mail-layout'
import { appUrl, sendMail } from '@/shared/server/mailer'
import type { Recipient } from '../model/types'

/**
 * Where a notification goes besides the bell. Each channel gets the same rendered message; adding
 * mobile push later = one more entry in CHANNELS (e.g. send to the user's device tokens), nothing
 * else changes. Channels are best-effort: a failure is logged, never breaks the action.
 */
export type Delivery = {
  recipient: Recipient
  locale: Locale
  title: string
  body: string
  /** in-app path, e.g. /messages/12 */
  link: string
}

export type Channel = { name: string; send(d: Delivery): Promise<void> }

const email: Channel = {
  name: 'email',
  async send({ recipient, locale, title, body, link }) {
    if (!recipient.email) return
    const t = MESSAGES[locale]
    await sendMail({
      to: recipient.email,
      subject: title,
      ...composeMail(t, dirOf(locale), {
        title,
        name: recipient.name.split(' ')[0] || recipient.name,
        body,
        action: t.notify.open,
        link: appUrl(link),
        footer: t.notify.emailFooter,
      }),
    })
  },
}

export const CHANNELS: Channel[] = [email]
