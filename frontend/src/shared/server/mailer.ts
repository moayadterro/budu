import 'server-only'
import nodemailer, { Transporter } from 'nodemailer'

/** Outgoing email through the real SMTP mailbox in .env (SMTP_*, MAIL_FROM). SERVER-SIDE ONLY. */

const g = globalThis as unknown as { __buduMailer?: Transporter }

function transport() {
  return (g.__buduMailer ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  }))
}

export async function sendMail(mail: {
  to: string
  subject: string
  text: string
  html: string
  /** where "Reply" goes (e.g. the visitor who wrote through the Contact form); default: MAIL_FROM */
  replyTo?: string
  /** inline pictures (e.g. the logo, referenced as cid:…) */
  attachments?: Array<{ filename: false; content: Buffer; cid: string; contentType: string; contentDisposition: 'inline' }>
}) {
  await transport().sendMail({ from: process.env.MAIL_FROM, ...mail })
}

/** Absolute link into the app, for emails. */
export const appUrl = (path: string) => new URL(path, process.env.APP_URL ?? 'http://localhost:3000').toString()
