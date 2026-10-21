'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/entities/session/server'
import { CURRENCIES } from '@/shared/config/currency'
import { formText } from '@/shared/lib/form'
import { setOverride } from '@/shared/server/fx'

export type RatesState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; at: number }

/** Platform admin: own rates ("1 USD = X") per currency; an empty field goes back to the automatic rate. */
export async function saveRatesAction(_prev: RatesState, form: FormData): Promise<RatesState> {
  const admin = await requireRole('admin')
  const at = Date.now()
  const values = CURRENCIES.filter((c) => c !== 'USD').map((c) => {
    const raw = formText(form, `rate_${c}`).replace(/\s/g, '').replace(',', '.')
    return { c, v: raw === '' ? null : Number(raw) }
  })
  if (values.some(({ v }) => v !== null && (!Number.isFinite(v) || v <= 0 || v > 1e9))) return { status: 'error', at }
  for (const { c, v } of values) await setOverride(c, v, admin.userId)
  revalidatePath('/', 'layout')
  return { status: 'saved', at }
}
