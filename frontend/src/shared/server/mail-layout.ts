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
const C = { page: '#FFFFFF', ink: '#0B2E1F', text: '#3D4A43', muted: '#7A867F', line: '#E7ECE9', brand: '#0B7A4A', onBrand: '#FFFFFF', soft: '#F4F7F5', brandSoft: '#E3F1EA' }
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

/**
 * Where the logo picture comes from. On a real domain: the website itself (public/email-logo.png) —
 * no attachment, like every modern sender. On localhost (dev) nobody outside can load it, so it
 * travels inside the email as an inline part (cid).
 */
const publicSite = () => !/^https?:\/\/(localhost|127\.|0\.0\.0\.0)/.test(process.env.APP_URL ?? 'http://localhost')

/** Centered logo: the picture when we have it, else the wordmark in text. */
function logoHtml() {
  const src = publicSite() ? appUrl('/email-logo.png') : logoPng ? 'cid:budu-logo' : null
  if (src) return `<img src="${src}" width="140" alt="Budu School" style="display:block;margin:0 auto;width:140px;height:auto;border:0">`
  return `<div style="font-family:${FONT};text-align:center;line-height:1">
  <span style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:${C.ink}">budu</span><br>
  <span style="font-size:9px;font-weight:700;letter-spacing:5px;color:${C.ink}">SCHOOL</span>
</div>`
}

/**
 * Every Budu email (account links, invites, notifications) in ONE modern, minimal layout — the way
 * Linear / Vercel / Stripe send theirs: white page, a narrow centred column, the logo, a large
 * heading, a short message, one green button, the link spelled out small, and a quiet footer.
 * Only the logo is centred; everything else (heading, message, button, notes) follows the reading
 * edge (left, right in Arabic) — centred text is hard to read. Optional `details` (a box of "label:
 * value" facts, e.g. exam / school) and `steps` ("what's next", numbered) make longer emails
 * scannable; `body` may hold several paragraphs separated by a blank line. Plain-text twin included.
 */
export function composeMail(
  t: Messages,
  dir: 'ltr' | 'rtl',
  mail: {
    title?: string
    name: string
    body: string
    action: string
    link: string
    footer?: string
    details?: Array<{ label: string; value: string }>
    steps?: { title: string; items: string[] }
  },
) {
  const { title, name, body, action, link, footer, details, steps } = mail
  const align = dir === 'rtl' ? 'right' : 'left' // email clients don't all know `start`
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const e = t.email
  const site = appUrl('/')
  const host = new URL(site).host

  const text = [
    ...(title ? [title, ''] : []),
    e.greeting(name),
    '',
    paragraphs.join('\n\n'),
    '',
    ...(details?.length ? [...details.map((d) => `${d.label}: ${d.value}`), ''] : []),
    ...(steps?.items.length ? [steps.title, ...steps.items.map((s, i) => `${i + 1}. ${s}`), ''] : []),
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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="max-width:480px;font-family:${FONT};text-align:${align}">
    <tr><td align="center" style="padding-bottom:40px">${logoHtml()}</td></tr>
    ${title ? `<tr><td align="${align}" style="padding-bottom:16px;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.3px;color:${C.ink}">${escape(title)}</td></tr>` : ''}
    <tr><td align="${align}" style="padding-bottom:12px;font-size:16px;line-height:1.6;color:${C.text};text-align:${align}">${escape(e.greeting(name))}</td></tr>
    ${paragraphs
      .map((p) => `<tr><td align="${align}" style="padding-bottom:16px;font-size:16px;line-height:1.6;color:${C.text};text-align:${align}">${escape(p)}</td></tr>`)
      .join('')}
    ${
      details?.length
        ? `<tr><td style="padding:8px 0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.soft};border-radius:12px">${details
            .map(
              (d, i) =>
                `<tr><td align="${align}" style="padding:${i ? '0' : '16px'} 20px 14px;text-align:${align}"><div style="font-size:12px;line-height:1.4;color:${C.muted}">${escape(d.label)}</div><div style="font-size:15px;line-height:1.4;font-weight:600;color:${C.ink}">${escape(d.value)}</div></td></tr>`,
            )
            .join('')}<tr><td style="font-size:0;line-height:0;padding-bottom:2px">&nbsp;</td></tr></table></td></tr>`
        : ''
    }
    ${
      steps?.items.length
        ? `<tr><td align="${align}" style="padding-bottom:12px;font-size:15px;line-height:1.4;font-weight:700;color:${C.ink};text-align:${align}">${escape(steps.title)}</td></tr>
    <tr><td style="padding-bottom:28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}">${steps.items
      .map(
        (s, i) =>
          `<tr><td width="28" valign="top" style="padding-bottom:10px"><div style="width:24px;height:24px;border-radius:12px;background:${C.brandSoft};color:${C.brand};font-size:13px;font-weight:700;line-height:24px;text-align:center">${i + 1}</div></td><td align="${align}" valign="top" style="padding:2px 10px 10px;font-size:15px;line-height:1.5;color:${C.text};text-align:${align}">${escape(s)}</td></tr>`,
      )
      .join('')}</table></td></tr>`
        : '<tr><td style="padding-bottom:16px"></td></tr>'
    }
    <tr><td align="${align}" style="padding-bottom:32px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}"><tr>
        <td align="center" bgcolor="${C.brand}" style="border-radius:10px">
          <a href="${escape(link)}" target="_blank" style="display:inline-block;padding:15px 32px;font-family:${FONT};font-size:16px;font-weight:600;line-height:1.2;color:${C.onBrand};text-decoration:none;border-radius:10px">${escape(action)}</a>
        </td>
      </tr></table>
    </td></tr>
    ${footer ? `<tr><td align="${align}" style="padding-bottom:24px;font-size:14px;line-height:1.5;color:${C.muted}">${escape(footer)}</td></tr>` : ''}
    <tr><td align="${align}" style="padding-bottom:32px;font-size:13px;line-height:1.5;color:${C.muted}">${escape(e.fallback)}<br><a href="${escape(link)}" style="color:${C.brand};text-decoration:none;word-break:break-all">${escape(link)}</a></td></tr>
    <tr><td align="${align}" style="border-top:1px solid ${C.line};padding-top:24px;font-size:12px;line-height:1.6;color:${C.muted}">
      ${escape(e.footer)}<br><a href="${escape(site)}" style="color:${C.muted};text-decoration:underline">${escape(host)}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`

  // dev only: the logo travels inside the email, marked inline and without a file name, so mail apps
  // show it in the body rather than as an attachment
  const attachments = !publicSite() && logoPng ? [{ filename: false as const, content: logoPng, cid: 'budu-logo', contentType: 'image/png', contentDisposition: 'inline' as const }] : []
  return { text, html, attachments }
}
