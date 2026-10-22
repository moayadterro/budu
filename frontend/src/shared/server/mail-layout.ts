import 'server-only'
import type { Messages } from '@/shared/i18n'
import { appUrl } from './mailer'

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/*
 * Email colours. The ONE place hex is allowed outside tokens.css: email clients can't read our CSS
 * variables, so these mirror the theme by hand (logo greens, text, muted, background).
 */
const C = {
  page: '#F3F5F4',
  card: '#FFFFFF',
  border: '#E3E8E5',
  brand: '#0B7A4A',
  brandDark: '#0B2E1F',
  text: '#26332C',
  muted: '#6B7A72',
  button: '#0B7A4A',
  buttonText: '#FFFFFF',
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','IBM Plex Sans Arabic',Tahoma,Arial,sans-serif"

/** The logo in plain HTML (tables, no image — never blocked): three steps + dot, "budu", "SCHOOL". */
function logo(dir: 'ltr' | 'rtl') {
  const bar = (w: number, offset: number) =>
    `<tr><td style="padding:0 0 3px ${dir === 'ltr' ? offset : 0}px"><div style="width:${w}px;height:6px;border-radius:2px;background:${C.brand};font-size:0;line-height:0">&nbsp;</div></td></tr>`
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr"><tr>
<td valign="bottom" style="padding-right:10px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:0 0 3px 18px"><div style="width:6px;height:6px;border-radius:3px;background:${C.brand};font-size:0;line-height:0">&nbsp;</div></td></tr>
    ${bar(18, 10)}${bar(22, 5)}${bar(25, 0)}
  </table>
</td>
<td valign="bottom" style="font-family:${FONT};line-height:1">
  <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:${C.brandDark}">budu</div>
  <div style="font-size:8px;font-weight:700;letter-spacing:4.2px;color:${C.brandDark};padding-top:2px">SCHOOL</div>
</td></tr></table>`
}

/**
 * Every Budu email (account links, invites, notifications) in one layout: logo, heading, greeting,
 * message, ONE big button (bulletproof: works in Outlook too), the link spelled out under it, an
 * optional small note (expiry, "ignore if not you"), the signature, and a quiet footer. Comes with a
 * plain-text version. `dir` = 'rtl' for Arabic.
 */
export function composeMail(
  t: Messages,
  dir: 'ltr' | 'rtl',
  mail: { title?: string; name: string; body: string; action: string; link: string; footer?: string },
) {
  const { title, name, body, action, link, footer } = mail
  const e = t.email
  const align = dir === 'rtl' ? 'right' : 'left'
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

  const p = (s: string, extra = '') => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${C.text};${extra}">${s}</p>`

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
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
    <tr><td style="padding:0 8px 20px" align="${align}" dir="${dir}">${logo(dir)}</td></tr>
    <tr><td dir="${dir}" style="background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:36px 32px;font-family:${FONT};text-align:${align}">
      ${title ? `<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:${C.brandDark}">${escape(title)}</h1>` : ''}
      ${p(escape(e.greeting(name)))}
      ${p(escape(body))}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr>
        <td align="center" bgcolor="${C.button}" style="border-radius:10px">
          <a href="${escape(link)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;line-height:1.2;color:${C.buttonText};text-decoration:none;border-radius:10px">${escape(action)}</a>
        </td>
      </tr></table>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${C.muted}">${escape(e.fallback)}<br><a href="${escape(link)}" style="color:${C.brand};word-break:break-all">${escape(link)}</a></p>
      ${footer ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${C.muted}">${escape(footer)}</p>` : ''}
      <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${C.border};font-size:15px;line-height:1.5;color:${C.text}">${escape(e.signature)}</p>
    </td></tr>
    <tr><td dir="${dir}" align="center" style="padding:20px 16px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};text-align:center">
      ${escape(e.footer)}<br><a href="${escape(site)}" style="color:${C.muted};text-decoration:underline">${escape(host)}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
  return { text, html }
}
