import 'server-only'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { issueToken } from '@/shared/server/tokens'
import { dirOf, type Messages } from '@/shared/i18n'
import { getLocale, getT } from '@/shared/i18n/server'

/** Account emails with single-use links, in the requester's language. SERVER-SIDE ONLY. */

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function compose(t: Messages, dir: 'ltr' | 'rtl', name: string, body: string, action: string, link: string, footer?: string) {
  const text = [t.email.greeting(name), '', body, '', `${action}: ${link}`, ...(footer ? ['', footer] : []), '', t.email.signature].join('\n')
  // Plain HTML on purpose: email clients can't use the app's CSS tokens.
  const html = [
    `<div dir="${dir}">`,
    `<p>${escape(t.email.greeting(name))}</p>`,
    `<p>${escape(body)}</p>`,
    `<p><a href="${escape(link)}">${escape(action)}</a></p>`,
    footer ? `<p>${escape(footer)}</p>` : '',
    `<p>${escape(t.email.signature)}</p>`,
    '</div>',
  ].join('')
  return { text, html }
}

export async function sendVerificationEmail(user: { id: number; email: string; firstname: string }) {
  const t = await getT()
  const dir = dirOf(await getLocale())
  const token = await issueToken('verify_email', user.id, 48 * 60)
  const link = appUrl(`/verify-email?token=${token}`)
  await sendMail({
    to: user.email,
    subject: t.email.verify.subject,
    ...compose(t, dir, user.firstname, t.email.verify.body, t.email.verify.action, link),
  })
}

export async function sendPasswordResetEmail(user: { id: number; email: string; firstname: string }) {
  const t = await getT()
  const dir = dirOf(await getLocale())
  const token = await issueToken('reset_password', user.id, 60)
  const link = appUrl(`/reset-password?token=${token}`)
  await sendMail({
    to: user.email,
    subject: t.email.reset.subject,
    ...compose(t, dir, user.firstname, t.email.reset.body, t.email.reset.action, link, t.email.reset.ignore),
  })
}
