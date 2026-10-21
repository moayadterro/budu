'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { rememberLocale } from '@/entities/notification/server'
import { getSession } from '@/entities/session/server'
import { isLocale, LOCALE_COOKIE } from '@/shared/i18n'

/** Saves the UI language for this browser (1 year) and re-renders everything in it. Public: also used on sign-in pages. */
export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return
  ;(await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  const user = await getSession()
  if (user) await rememberLocale(user.userId, locale) // emails + notifications in this language
  revalidatePath('/', 'layout')
}
