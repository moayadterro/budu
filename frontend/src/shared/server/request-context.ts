import 'server-only'
import { createHash } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { SESSION_COOKIE } from '@/shared/config/auth'
import { query } from './db'
import { hashSecret } from './tokens'

/** Who is acting in this request (from the session cookie), or null — for logs and error reports. */
export type Actor = { userId: number; name: string; role: string; companyId: number | null }

/** The signed-in user of the current request, if any. Never throws (outside a request → null). */
export async function currentActor(): Promise<Actor | null> {
  try {
    const raw = (await cookies()).get(SESSION_COOKIE)?.value
    if (!raw) return null
    const [row] = await query<{ iomad_user_id: number; name: string; role: string; company_id: number | null }>(
      `SELECT iomad_user_id, name, role, company_id FROM sessions WHERE token_hash = $1 AND expires_at > now()`,
      [hashSecret(raw)],
    )
    return row ? { userId: row.iomad_user_id, name: row.name, role: row.role, companyId: row.company_id } : null
  } catch {
    return null
  }
}

/** sha256 of the caller's IP (we never store raw addresses), the page they were on, their browser. */
export async function requestInfo(): Promise<{ ipHash: string | null; page: string | null; userAgent: string | null }> {
  try {
    const h = await headers()
    const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || ''
    const referer = h.get('referer')
    return {
      ipHash: ip ? createHash('sha256').update(ip).digest('hex') : null,
      page: referer ? new URL(referer).pathname : null,
      userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
    }
  } catch {
    return { ipHash: null, page: null, userAgent: null }
  }
}

/** Production = a real public address; localhost / dev never emails alerts. */
export const isProduction = () =>
  process.env.NODE_ENV === 'production' && !/^https?:\/\/(localhost|127\.|0\.0\.0\.0)/.test(process.env.APP_URL ?? 'http://localhost')
