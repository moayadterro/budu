import 'server-only'
import type { AuditAction } from '@/shared/config/audit'
import { query } from './db'
import { reportError } from './errors'
import { currentActor, requestInfo, type Actor } from './request-context'

/**
 * Record what happened in the activity log (Admin → Activity): who (the real person, not the
 * integration account IOMAD sees), their role and school, what, on which object, success or not,
 * and a hash of their IP. Best effort: never throws, never blocks the action.
 *
 *   audit('quizPublished', { target: `quiz ${quizId}`, details: { name } })
 *   audit('signInFailed', { actor: null, details: { email }, ok: false })   // nobody signed in yet
 */
export function audit(
  action: AuditAction,
  opts: { actor?: Actor | null; companyId?: number | null; target?: string; details?: Record<string, unknown>; ok?: boolean } = {},
) {
  void (async () => {
    const actor = opts.actor !== undefined ? opts.actor : await currentActor()
    const { ipHash } = await requestInfo()
    await query(
      `INSERT INTO audit_log (user_id, user_name, role, company_id, action, target, details, ok, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [
        actor?.userId ?? null,
        actor?.name ?? null,
        actor?.role ?? null,
        opts.companyId !== undefined ? opts.companyId : (actor?.companyId ?? null),
        action,
        opts.target?.slice(0, 300) ?? null,
        JSON.stringify(opts.details ?? {}),
        opts.ok ?? true,
        ipHash,
      ],
    )
  })().catch((e) => reportError('activity log write failed', e))
}

/** Old entries go: activity after a year, errors after 90 days. Runs from the app shell, throttled. */
let lastPrune = 0
export async function pruneLogs() {
  if (Date.now() - lastPrune < 6 * 3600_000) return
  lastPrune = Date.now()
  await query(`DELETE FROM audit_log WHERE at < now() - interval '1 year'`)
  await query(`DELETE FROM error_log WHERE last_at < now() - interval '90 days'`)
}

// ----- reading (Admin → Activity / Errors) -----

export type AuditEntry = {
  id: number
  at: number
  userId: number | null
  userName: string | null
  role: string | null
  companyId: number | null
  action: string
  target: string | null
  details: Record<string, unknown>
  ok: boolean
}

/** Newest first, `pageSize` per page; filters: text (name / target / details), one action, failures only. */
export async function listAudit(f: { q?: string; action?: string; failedOnly?: boolean; page: number; pageSize: number }) {
  const where: string[] = []
  const args: unknown[] = []
  if (f.q) {
    args.push(`%${f.q.toLowerCase()}%`)
    where.push(`(lower(coalesce(user_name, '')) LIKE $${args.length} OR lower(coalesce(target, '')) LIKE $${args.length} OR lower(details::text) LIKE $${args.length})`)
  }
  if (f.action) {
    args.push(f.action)
    where.push(`action = $${args.length}`)
  }
  if (f.failedOnly) where.push('NOT ok')
  const cond = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const [{ total }] = await query<{ total: number }>(`SELECT count(*)::int AS total FROM audit_log ${cond}`, args)
  const rows = await query<{
    id: string; at: number; user_id: number | null; user_name: string | null; role: string | null; company_id: number | null
    action: string; target: string | null; details: Record<string, unknown>; ok: boolean
  }>(
    `SELECT id, extract(epoch FROM at)::int AS at, user_id, user_name, role, company_id, action, target, details, ok
       FROM audit_log ${cond} ORDER BY at DESC, id DESC LIMIT ${f.pageSize} OFFSET ${f.page * f.pageSize}`,
    args,
  )
  const entries: AuditEntry[] = rows.map((r) => ({
    id: Number(r.id), at: r.at, userId: r.user_id, userName: r.user_name, role: r.role, companyId: r.company_id,
    action: r.action, target: r.target, details: r.details, ok: r.ok,
  }))
  return { total, entries }
}

export type ErrorEntry = {
  fingerprint: string
  source: string
  place: string
  message: string
  stack: string | null
  page: string | null
  userId: number | null
  userName: string | null
  userRole: string | null
  userAgent: string | null
  companyId: number | null
  details: Record<string, unknown>
  count: number
  firstAt: number
  lastAt: number
  emailedAt: number | null
}

/** Distinct errors, most recent first. */
export async function listErrors(f: { page: number; pageSize: number }) {
  const [{ total }] = await query<{ total: number }>(`SELECT count(*)::int AS total FROM error_log`)
  const rows = await query<{
    fingerprint: string; source: string; place: string; message: string; stack: string | null; page: string | null
    user_id: number | null; company_id: number | null; count: number; first_at: number; last_at: number; emailed_at: number | null
    user_name: string | null; user_role: string | null; user_agent: string | null; details: Record<string, unknown>
  }>(
    `SELECT fingerprint, source, place, message, stack, page, user_id, company_id, count, user_name, user_role, user_agent, details,
            extract(epoch FROM first_at)::int AS first_at, extract(epoch FROM last_at)::int AS last_at,
            extract(epoch FROM emailed_at)::int AS emailed_at
       FROM error_log ORDER BY last_at DESC LIMIT ${f.pageSize} OFFSET ${f.page * f.pageSize}`,
  )
  const entries: ErrorEntry[] = rows.map((r) => ({
    fingerprint: r.fingerprint, source: r.source, place: r.place, message: r.message, stack: r.stack, page: r.page,
    userId: r.user_id, userName: r.user_name, userRole: r.user_role, userAgent: r.user_agent, details: r.details ?? {},
    companyId: r.company_id, count: r.count, firstAt: r.first_at, lastAt: r.last_at, emailedAt: r.emailed_at,
  }))
  return { total, entries }
}
