'use server'

import { revalidatePath } from 'next/cache'
import { rememberLocale } from '@/entities/notification/server'
import { getSession } from '@/entities/session/server'
import { isLocale } from '@/shared/i18n'
import { rememberBrowserLocale } from '@/shared/i18n/server'

/** Saves the UI language for this browser (1 year) and re-renders everything in it. Public: also used on sign-in pages. */
export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return
  await rememberBrowserLocale(locale)
  const user = await getSession()
  if (user) await rememberLocale(user.userId, locale) // emails + notifications in this language
  revalidatePath('/', 'layout')
}
