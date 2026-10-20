import 'server-only'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { getAccount, roleFor } from '@/entities/user/@x/session'
import { query } from '@/shared/server/db'
import { hashSecret, newSecret } from '@/shared/server/tokens'
import { SESSION_COOKIE } from '@/shared/config/auth'
import type { Role } from '@/shared/config/nav'
import type { SessionUser } from '../model/types'

/**
 * Server sessions: random cookie value, only its hash in app-db, 30-day expiry,
 * revocable (sign-out, password reset). Role and name are re-read from IOMAD
 * every REFRESH_MINUTES, so role changes and suspensions take effect without
 * signing out. SERVER-SIDE ONLY.
 */

const MAX_AGE_DAYS = 30
const REFRESH_MINUTES = 5

export async function createSession(user: SessionUser) {
  const raw = newSecret()
  await query(
    `INSERT INTO sessions (token_hash, iomad_user_id, role, company_id, name, email, picture_id, expires_at, refreshed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now() + make_interval(days => $8), now())`,
    [hashSecret(raw), user.userId, user.role, user.companyId, user.name, user.email, user.pictureId, MAX_AGE_DAYS],
  )
  const jar = await cookies()
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  })
}

type Row = {
  iomad_user_id: number
  role: Role
  company_id: number | null
  name: string
  email: string
  picture_id: number | null
  stale: boolean
}

/** The signed-in user, or null. Cached per request. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value
  if (!raw) return null
  const hash = hashSecret(raw)
  const [row] = await query<Row>(
    `SELECT iomad_user_id, role, company_id, name, email, picture_id,
            refreshed_at < now() - make_interval(mins => $2) AS stale
       FROM sessions WHERE token_hash = $1 AND expires_at > now()`,
    [hash, REFRESH_MINUTES],
  )
  if (!row) return null
  const user: SessionUser = {
    userId: row.iomad_user_id,
    role: row.role,
    companyId: row.company_id,
    name: row.name,
    email: row.email,
    pictureId: row.picture_id,
  }
  return row.stale ? refresh(hash, user) : user
})

/** Re-read role/name from IOMAD. Gone or suspended → session ends; IOMAD unreachable → keep as is. */
async function refresh(hash: string, user: SessionUser): Promise<SessionUser | null> {
  try {
    const account = await getAccount(user.email)
    if (!account.found || account.suspended || account.id !== user.userId) {
      await query(`DELETE FROM sessions WHERE token_hash = $1`, [hash])
      return null
    }
    const { role, companyId } = roleFor(account.memberships, account.siteadmin)
    const name = `${account.firstname} ${account.lastname}`.trim()
    const pictureId = account.picture || null
    await query(
      `UPDATE sessions SET role = $2, company_id = $3, name = $4, picture_id = $5, refreshed_at = now() WHERE token_hash = $1`,
      [hash, role, companyId, name, pictureId],
    )
    return { ...user, role, companyId, name, pictureId }
  } catch (e) {
    console.error('session refresh failed; keeping current session', e)
    return user
  }
}

export async function destroySession() {
  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE)?.value
  if (raw) await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashSecret(raw)])
  jar.delete(SESSION_COOKIE)
}

/**
 * Server-side authorization for a page or action: the signed-in user, if their role is allowed.
 * Not signed in → sign-in page; wrong role → 404 (doesn't reveal the page exists).
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getSession()
  if (!user) redirect('/login')
  if (!roles.includes(user.role)) notFound()
  return user
}

/** After a profile change: update the name / picture shown by all of the user's sessions. */
export async function updateSessionProfile(userId: number, profile: { name?: string; pictureId?: number | null }) {
  if (profile.name !== undefined) await query(`UPDATE sessions SET name = $2 WHERE iomad_user_id = $1`, [userId, profile.name])
  if (profile.pictureId !== undefined) {
    await query(`UPDATE sessions SET picture_id = $2 WHERE iomad_user_id = $1`, [userId, profile.pictureId])
  }
}

/** Sign the user out on every other device, keeping this session (e.g. after changing the password). */
export async function revokeOtherSessions(userId: number) {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value
  await query(`DELETE FROM sessions WHERE iomad_user_id = $1 AND token_hash <> $2`, [userId, raw ? hashSecret(raw) : ''])
}

/** Sign the user out everywhere (e.g. after a password reset). */
export async function revokeUserSessions(userId: number) {
  await query(`DELETE FROM sessions WHERE iomad_user_id = $1`, [userId])
}
