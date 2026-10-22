import 'server-only'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Messages } from '@/shared/i18n'
import { appUrl } from './mailer'

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/*
 * Email colours — the ONE place hex is allowed outside tokens.css (email clients can't read CSS
 * variables), mirroring the theme: logo greens, ink, muted, hairlines.
 */
const C = { page: '#FFFFFF', ink: '#0B2E1F', text: '#3D4A43', muted: '#7A867F', line: '#E7ECE9', brand: '#0B7A4A', onBrand: '#FFFFFF' }
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','IBM Plex Sans Arabic',Tahoma,Arial,sans-serif"

/** The logo picture, sent inside the email (cid) so it shows without loading anything. */
const LOGO_FILE = join(process.cwd(), 'src/assets/logo-email.png')
const logoPng = (() => {
  try {
    return existsSync(LOGO_FILE) ? readFileSync(LOGO_FILE) : null
  } catch {
    return null
  }
})()

/** Centered logo: the picture when we have it, else the wordmark in text. */
function logoHtml() {
  if (logoPng) return `<img src="cid:budu-logo" width="120" alt="Budu" style="display:block;margin:0 auto;width:120px;height:auto;border:0">`
  return `<div style="font-family:${FONT};text-align:center;line-height:1">
  <span style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:${C.ink}">budu</span><br>
  <span style="font-size:9px;font-weight:700;letter-spacing:5px;color:${C.ink}">SCHOOL</span>
</div>`
}

/**
 * Every Budu email (account links, invites, notifications) in ONE modern, minimal layout — the way
 * Linear / Vercel / Stripe send theirs: white page, a narrow centred column, the logo, a large
 * heading, a short message, one green button, the link spelled out small, and a quiet footer.
 * Centred, so it reads the same in Arabic (`dir`). Comes with a plain-text twin.
 */
export function composeMail(
  t: Messages,
  dir: 'ltr' | 'rtl',
  mail: { title?: string; name: string; body: string; action: string; link: string; footer?: string },
) {
  const { title, name, body, action, link, footer } = mail
  const e = t.email
  const site = appUrl('/')
  const host = new URL(site).host

  const text = [
    ...(title ? [title, ''] : []),
    e.greeting(name),
    '',
    body,
    '',
    `${action}: ${link}`,
    ...(footer ? ['', footer] : []),
    '',
    e.signature,
    '',
    '—',
    e.footer,
    site,
  ].join('\n')

  const html = `<!doctype html>
<html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(title ?? action)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escape(body.slice(0, 140))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}">
<tr><td align="center" style="padding:48px 20px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="max-width:480px;font-family:${FONT};text-align:center">
    <tr><td align="center" style="padding-bottom:40px">${logoHtml()}</td></tr>
    ${title ? `<tr><td style="padding-bottom:16px;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.3px;color:${C.ink}">${escape(title)}</td></tr>` : ''}
    <tr><td style="padding-bottom:8px;font-size:16px;line-height:1.6;color:${C.text}">${escape(e.greeting(name))}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:16px;line-height:1.6;color:${C.text}">${escape(body)}</td></tr>
    <tr><td align="center" style="padding-bottom:32px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" bgcolor="${C.brand}" style="border-radius:10px">
          <a href="${escape(link)}" target="_blank" style="display:inline-block;padding:15px 32px;font-family:${FONT};font-size:16px;font-weight:600;line-height:1.2;color:${C.onBrand};text-decoration:none;border-radius:10px">${escape(action)}</a>
        </td>
      </tr></table>
    </td></tr>
    ${footer ? `<tr><td style="padding-bottom:24px;font-size:14px;line-height:1.5;color:${C.muted}">${escape(footer)}</td></tr>` : ''}
    <tr><td style="padding-bottom:32px;font-size:13px;line-height:1.5;color:${C.muted}">${escape(e.fallback)}<br><a href="${escape(link)}" style="color:${C.brand};text-decoration:none;word-break:break-all">${escape(link)}</a></td></tr>
    <tr><td style="border-top:1px solid ${C.line};padding-top:24px;font-size:12px;line-height:1.6;color:${C.muted}">
      ${escape(e.footer)}<br><a href="${escape(site)}" style="color:${C.muted};text-decoration:underline">${escape(host)}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`

  // the logo travels inside the email (no external image to block)
  const attachments = logoPng ? [{ filename: 'budu.png', content: logoPng, cid: 'budu-logo' }] : []
  return { text, html, attachments }
}
