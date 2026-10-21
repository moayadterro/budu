import 'server-only'
import { DEFAULT_CURRENCY, isCurrency, type Currency } from '@/shared/config/currency'
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
