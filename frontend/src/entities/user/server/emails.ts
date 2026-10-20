import 'server-only'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { issueToken } from '@/shared/server/tokens'
import { t } from '@/shared/i18n'

/** Account emails with single-use links. SERVER-SIDE ONLY. */

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function compose(name: string, body: string, action: string, link: string, footer?: string) {
  const text = [t.email.greeting(name), '', body, '', `${action}: ${link}`, ...(footer ? ['', footer] : []), '', t.email.signature].join('\n')
  // Plain HTML on purpose: email clients can't use the app's CSS tokens.
  const html = [
    `<p>${escape(t.email.greeting(name))}</p>`,
    `<p>${escape(body)}</p>`,
    `<p><a href="${escape(link)}">${escape(action)}</a></p>`,
    footer ? `<p>${escape(footer)}</p>` : '',
    `<p>${escape(t.email.signature)}</p>`,
  ].join('')
  return { text, html }
}

export async function sendVerificationEmail(user: { id: number; email: string; firstname: string }) {
  const token = await issueToken('verify_email', user.id, 48 * 60)
  const link = appUrl(`/verify-email?token=${token}`)
  await sendMail({
    to: user.email,
    subject: t.email.verify.subject,
    ...compose(user.firstname, t.email.verify.body, t.email.verify.action, link),
  })
}

export async function sendPasswordResetEmail(user: { id: number; email: string; firstname: string }) {
  const token = await issueToken('reset_password', user.id, 60)
  const link = appUrl(`/reset-password?token=${token}`)
  await sendMail({
    to: user.email,
    subject: t.email.reset.subject,
    ...compose(user.firstname, t.email.reset.body, t.email.reset.action, link, t.email.reset.ignore),
  })
}
