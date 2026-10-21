'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/entities/session/server'
import { rememberVisitorCurrency, setCurrency } from '@/entities/user/server'
import { isCurrency } from '@/shared/config/currency'

/** The currency prices are shown in: saved for a signed-in user (Settings), and always in this browser (cookie) so signed-out pages match. */
export async function setCurrencyAction(currency: string) {
  if (!isCurrency(currency)) return
  const user = await getSession()
  if (user) await setCurrency(user.userId, currency)
  await rememberVisitorCurrency(currency)
  revalidatePath('/', 'layout')
}
