import 'server-only'
import { CURRENCIES } from '@/shared/config/currency'
import type { Rates } from '@/shared/lib/money'
import { query } from './db'

/**
 * Exchange rates (units per 1 USD) in app-db `fx_rates`, refreshed at most once a day from a free
 * rates service; the platform admin's `fx_overrides` win (e.g. a realistic market rate for SYP).
 * A failed refresh keeps the last rates. SERVER-SIDE ONLY.
 */

const SOURCE = 'https://open.er-api.com/v6/latest/USD'
const MAX_AGE_HOURS = 24

const g = globalThis as unknown as { __buduFx?: Promise<void> }

async function refresh() {
  const res = await fetch(SOURCE, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`rates: HTTP ${res.status}`)
  const data = (await res.json()) as { result?: string; rates?: Record<string, number> }
  if (data.result !== 'success' || !data.rates) throw new Error('rates: bad response')
  const codes = CURRENCIES.filter((c) => typeof data.rates![c] === 'number' && data.rates![c] > 0)
  await query(
    `INSERT INTO fx_rates (currency, per_usd, updated_at) SELECT unnest($1::text[]), unnest($2::numeric[]), now()
     ON CONFLICT (currency) DO UPDATE SET per_usd = EXCLUDED.per_usd, updated_at = now()`,
    [codes, codes.map((c) => data.rates![c])],
  )
}

async function ensureFresh() {
  const [row] = await query<{ stale: boolean }>(
    `SELECT coalesce(max(updated_at), 'epoch') < now() - make_interval(hours => $1) AS stale FROM fx_rates`,
    [MAX_AGE_HOURS],
  )
  if (!row?.stale) return
  // one refresh at a time per server process
  g.__buduFx ??= refresh()
    .catch((e) => console.error('exchange rates refresh failed; keeping the last rates', e))
    .finally(() => (g.__buduFx = undefined))
  await g.__buduFx
}

export type RateRow = { currency: string; auto: number | null; override: number | null; updatedAt: number | null }

/** Rates for conversions: automatic ones with the admin's overrides applied. USD = 1. */
export async function getRates(): Promise<Rates> {
  await ensureFresh()
  const rows = await query<{ currency: string; per_usd: string }>(
    `SELECT currency, per_usd, 0 AS o FROM fx_rates
     UNION ALL SELECT currency, per_usd, 1 FROM fx_overrides ORDER BY o`, // overrides last, so they win
  )
  const rates: Rates = { USD: 1 }
  for (const r of rows) rates[r.currency] = Number(r.per_usd)
  return rates
}

/** For the admin page: each currency's automatic rate, override and last update. */
export async function rateTable(): Promise<RateRow[]> {
  await ensureFresh()
  const rows = await query<{ currency: string; auto: string | null; override: string | null; updated: number | null }>(
    `SELECT c AS currency, r.per_usd AS auto, o.per_usd AS override, extract(epoch FROM r.updated_at)::int AS updated
       FROM unnest($1::text[]) c LEFT JOIN fx_rates r ON r.currency = c LEFT JOIN fx_overrides o ON o.currency = c`,
    [[...CURRENCIES]],
  )
  return rows.map((r) => ({
    currency: r.currency,
    auto: r.currency === 'USD' ? 1 : r.auto === null ? null : Number(r.auto),
    override: r.override === null ? null : Number(r.override),
    updatedAt: r.updated,
  }))
}

/** Set (rate) or clear (null) the admin's override for a currency. */
export async function setOverride(currency: string, perUsd: number | null, adminId: number) {
  if (perUsd === null) await query(`DELETE FROM fx_overrides WHERE currency = $1`, [currency])
  else {
    await query(
      `INSERT INTO fx_overrides (currency, per_usd, updated_by) VALUES ($1, $2, $3)
       ON CONFLICT (currency) DO UPDATE SET per_usd = EXCLUDED.per_usd, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [currency, perUsd, adminId],
    )
  }
}
