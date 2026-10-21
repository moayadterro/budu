import 'server-only'
import type { Messages } from '@/shared/i18n'

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/**
 * Text + HTML body of a Budu email: greeting, message, one action link, optional footer, signature.
 * Plain HTML on purpose (email clients can't use the app's CSS tokens); `dir` for Arabic.
 */
export function composeMail(
  t: Messages,
  dir: 'ltr' | 'rtl',
  mail: { name: string; body: string; action: string; link: string; footer?: string },
) {
  const { name, body, action, link, footer } = mail
  const text = [t.email.greeting(name), '', body, '', `${action}: ${link}`, ...(footer ? ['', footer] : []), '', t.email.signature].join('\n')
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
