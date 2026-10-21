'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/entities/session/server'
import { setCurrency } from '@/entities/user/server'
import { isCurrency } from '@/shared/config/currency'

/** The currency prices are shown in for this user (Settings). */
export async function setCurrencyAction(currency: string) {
  const user = await getSession()
  if (!user || !isCurrency(currency)) return
  await setCurrency(user.userId, currency)
  revalidatePath('/', 'layout')
}
