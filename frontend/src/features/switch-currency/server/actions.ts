'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getSession } from '@/entities/session/server'
import { setCurrency, VISITOR_CURRENCY_COOKIE } from '@/entities/user/server'
import { isCurrency } from '@/shared/config/currency'

/** The currency prices are shown in: saved for a signed-in user (Settings), in a cookie for a visitor. */
export async function setCurrencyAction(currency: string) {
  if (!isCurrency(currency)) return
  const user = await getSession()
  if (user) await setCurrency(user.userId, currency)
  else (await cookies()).set(VISITOR_CURRENCY_COOKIE, currency, { path: '/', maxAge: 365 * 24 * 3600, sameSite: 'lax' })
  revalidatePath('/', 'layout')
}
