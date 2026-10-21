import 'server-only'
import { DEFAULT_CURRENCY, isCurrency, type Currency } from '@/shared/config/currency'
import { cookies } from 'next/headers'
import { query } from '@/shared/server/db'

/** The currency the user sees prices in (Settings); the platform default (RUB) if not chosen. */
export async function getCurrency(userId: number): Promise<Currency> {
  const [row] = await query<{ currency: string | null }>(`SELECT currency FROM user_prefs WHERE iomad_user_id = $1`, [userId])
  return isCurrency(row?.currency) ? row.currency : DEFAULT_CURRENCY
}

export async function setCurrency(userId: number, currency: Currency) {
  await query(
    `INSERT INTO user_prefs (iomad_user_id, currency) VALUES ($1, $2)
     ON CONFLICT (iomad_user_id) DO UPDATE SET currency = EXCLUDED.currency, updated_at = now()`,
    [userId, currency],
  )
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
