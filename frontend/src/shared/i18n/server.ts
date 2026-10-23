import 'server-only'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { isLocale, LOCALE_COOKIE, LOCALE_HEADER, matchLocale, type Locale } from './config'
import { MESSAGES, type Messages } from './messages'

/**
 * The request's locale. A public page's URL decides (/ru/… — the proxy passes it in LOCALE_HEADER).
 * Elsewhere (owner's rule): the user's own choice (cookie — set when they pick a language, and at
 * sign-in from their account), else the browser's preferred language if Budu has it, else English.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromUrl = (await headers()).get(LOCALE_HEADER)
  if (isLocale(fromUrl)) return fromUrl
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(chosen)) return chosen
  return matchLocale((await headers()).get('accept-language'))
})

/** Keep this language in the browser (1 year) — it then wins over the browser's own language. */
export async function rememberBrowserLocale(locale: Locale) {
  ;(await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

/** UI strings in the request's language, for server components and server code: `const t = await getT()`. */
export async function getT(): Promise<Messages> {
  return MESSAGES[await getLocale()]
}

/** The strings of one language, for server code that writes to someone else than the visitor
 *  (e.g. the team's email about a Contact message, always in English). */
export const messagesFor = (locale: Locale): Messages => MESSAGES[locale]
