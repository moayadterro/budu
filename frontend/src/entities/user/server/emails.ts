import 'server-only'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { issueToken } from '@/shared/server/tokens'
import { dirOf } from '@/shared/i18n'
import { composeMail } from '@/shared/server/mail-layout'
import { getLocale, getT } from '@/shared/i18n/server'

/** Account emails with single-use links, in the requester's language. SERVER-SIDE ONLY. */

export async function sendVerificationEmail(user: { id: number; email: string; firstname: string }) {
  const t = await getT()
  const dir = dirOf(await getLocale())
  const token = await issueToken('verify_email', user.id, 48 * 60)
  const link = appUrl(`/verify-email?token=${token}`)
  await sendMail({
    to: user.email,
    subject: t.email.verify.subject,
    ...composeMail(t, dir, { name: user.firstname, body: t.email.verify.body, action: t.email.verify.action, link }),
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
    ...composeMail(t, dir, { name: user.firstname, body: t.email.reset.body, action: t.email.reset.action, link, footer: t.email.reset.ignore }),
  })
}
