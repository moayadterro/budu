import 'server-only'
import { createHash, randomBytes } from 'crypto'
import { query } from './db'

/** Random, URL-safe secret (sessions, email links). */
export const newSecret = () => randomBytes(32).toString('base64url')
/** Only hashes are stored, so a database leak can't be replayed. */
export const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex')

export type TokenPurpose = 'verify_email' | 'reset_password' | 'invite'

/** Issues a single-use token; earlier unused tokens for the same purpose stop working. SERVER-SIDE ONLY. */
export async function issueToken(purpose: TokenPurpose, userId: number, ttlMinutes: number) {
  const raw = newSecret()
  await query(`UPDATE auth_tokens SET used_at = now() WHERE iomad_user_id = $1 AND purpose = $2 AND used_at IS NULL`, [
    userId,
    purpose,
  ])
  await query(
    `INSERT INTO auth_tokens (token_hash, purpose, iomad_user_id, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [hashSecret(raw), purpose, userId, ttlMinutes],
  )
  return raw
}

/** Atomically marks a valid token used; returns its user id, or null if invalid/expired/used. */
export async function consumeToken(purpose: TokenPurpose, raw: string): Promise<number | null> {
  const rows = await query<{ iomad_user_id: number }>(
    `UPDATE auth_tokens SET used_at = now()
      WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
      RETURNING iomad_user_id`,
    [hashSecret(raw), purpose],
  )
  return rows[0]?.iomad_user_id ?? null
}

/** Undo consumeToken when the follow-up step failed, so the link still works. */
export async function releaseToken(purpose: TokenPurpose, raw: string) {
  await query(`UPDATE auth_tokens SET used_at = NULL WHERE token_hash = $1 AND purpose = $2 AND expires_at > now()`, [
    hashSecret(raw),
    purpose,
  ])
}

/** Is there an unused, unexpired token? (e.g. an account still awaiting email confirmation) */
export async function hasPendingToken(purpose: TokenPurpose, userId: number) {
  const rows = await query(
    `SELECT 1 FROM auth_tokens WHERE iomad_user_id = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now() LIMIT 1`,
    [userId, purpose],
  )
  return rows.length > 0
}

/** Throttle: was a token of this purpose issued in the last `seconds`? */
export async function issuedRecently(purpose: TokenPurpose, userId: number, seconds: number) {
  const rows = await query(
    `SELECT 1 FROM auth_tokens WHERE iomad_user_id = $1 AND purpose = $2 AND created_at > now() - make_interval(secs => $3) LIMIT 1`,
    [userId, purpose, seconds],
  )
  return rows.length > 0
}
