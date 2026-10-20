import 'server-only'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { isLocale, LOCALE_COOKIE, matchLocale, type Locale } from './config'
import { MESSAGES, type Messages } from './messages'

/** The request's locale: the Settings choice (cookie), else the browser's Accept-Language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(chosen)) return chosen
  return matchLocale((await headers()).get('accept-language'))
})

/** UI strings in the request's language, for server components and server code: `const t = await getT()`. */
export async function getT(): Promise<Messages> {
  return MESSAGES[await getLocale()]
}
