import 'server-only'
import { DEFAULT_CURRENCY, isCurrency, type Currency } from '@/shared/config/currency'
import { cookies } from 'next/headers'
import { prefsOfUser, setPref } from '@/shared/server/user-prefs'
import { isLocale } from '@/shared/i18n'
import { getLocale, rememberBrowserLocale } from '@/shared/i18n/server'

/** The currency the user sees prices in (Settings; an IOMAD user preference); RUB if not chosen. */
export async function getCurrency(userId: number): Promise<Currency> {
  const c = (await prefsOfUser(userId)).currency
  return isCurrency(c) ? c : DEFAULT_CURRENCY
}

export async function setCurrency(userId: number, currency: Currency) {
  await setPref(userId, 'budu_currency', currency)
}

/** A visitor's (not signed in) chosen currency lives in this cookie. */
export const VISITOR_CURRENCY_COOKIE = 'budu_currency'

/** The currency a visitor sees prices in: their cookie, else the platform default. */
export async function visitorCurrency(): Promise<Currency> {
  const v = (await cookies()).get(VISITOR_CURRENCY_COOKIE)?.value
  return isCurrency(v) ? v : DEFAULT_CURRENCY
}

/** Remember the currency in this browser too, so signed-out pages (the public catalog) use it. */
export async function rememberVisitorCurrency(currency: Currency) {
  ;(await cookies()).set(VISITOR_CURRENCY_COOKIE, currency, { path: '/', maxAge: 365 * 24 * 3600, sameSite: 'lax' })
}

/** At sign-in the account's currency (Settings, else RUB) wins: the browser's cookie follows it. */
export async function syncCurrency(userId: number) {
  await rememberVisitorCurrency(await getCurrency(userId))
}

/**
 * At sign-in the account's language wins (owner: "user settings if he already used the app"): this
 * browser switches to it, whatever it showed before. A first sign-in keeps what they see now and
 * saves it as their language (emails and notifications use it too).
 */
export async function syncLocale(userId: number) {
  const saved = (await prefsOfUser(userId)).locale
  if (isLocale(saved)) await rememberBrowserLocale(saved)
  else await setPref(userId, 'budu_locale', await getLocale())
}
