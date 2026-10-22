import 'server-only'
import { createHash } from 'node:crypto'
import { query } from './db'
import { appUrl, sendMail } from './mailer'
import { currentActor, isProduction, requestInfo, type Actor } from './request-context'

const EMAIL_EVERY_MINUTES = 15

type Extra = {
  source?: 'server' | 'browser'
  page?: string
  actor?: Actor | null
  /** anything that helps: ids, the request kind, the IOMAD function … (shown in Admin → Errors and the email) */
  details?: Record<string, unknown>
}

/**
 * Report an error: printed to the server log, saved in `error_log` (grouped: the same error from
 * the same place is one row with a counter) and — in production only — emailed to ALERT_EMAIL with
 * the stack, at most once per 15 minutes per error ("happened 37 more times since").
 * Never throws and never blocks the caller: use it wherever `console.error` was used.
 *
 *   reportError('save course failed', e)
 */
export function reportError(where: string, error: unknown, extra?: Extra) {
  console.error(where, error)
  void record(where, error, extra).catch((e) => console.error('error report failed', e))
}

async function record(where: string, error: unknown, extra?: Extra) {
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error))
  const message = `${err.name}: ${err.message}`.slice(0, 2000)
  // the stack, plus the chain of causes (`new Error('…', { cause })`)
  let stack = err.stack ?? ''
  for (let c = (err as { cause?: unknown }).cause, i = 0; c && i < 3; c = (c as { cause?: unknown }).cause, i++) {
    stack += `\nCaused by: ${c instanceof Error ? (c.stack ?? c.message) : String(c)}`
  }
  stack = stack.slice(0, 12000)
  const actor = extra?.actor !== undefined ? extra.actor : await currentActor()
  const info = await requestInfo()
  const page = extra?.page ?? info.page
  // IOMAD errors carry the function, error code and Moodle's own debug text
  const details = { ...((err as { details?: Record<string, unknown> }).details ?? {}), ...(extra?.details ?? {}) }
  if ((err as { code?: unknown }).code !== undefined && details.code === undefined) details.code = (err as { code?: unknown }).code
  // the same error = same place + same message (numbers/ids blanked) + same first stack frame
  const frame = stack.split('\n').find((l) => l.trim().startsWith('at ')) ?? ''
  const fingerprint = createHash('sha1')
    .update([where, message.replace(/\d+/g, '#'), frame.replace(/:\d+\)?$/, '')].join('|'))
    .digest('hex')
  await query(
    `INSERT INTO error_log (fingerprint, source, place, message, stack, page, user_id, company_id, user_name, user_role, user_agent, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
     ON CONFLICT (fingerprint) DO UPDATE SET count = error_log.count + 1, since_email = error_log.since_email + 1,
       last_at = now(), stack = EXCLUDED.stack, page = EXCLUDED.page, user_id = EXCLUDED.user_id, company_id = EXCLUDED.company_id,
       user_name = EXCLUDED.user_name, user_role = EXCLUDED.user_role, user_agent = EXCLUDED.user_agent, details = EXCLUDED.details`,
    [
      fingerprint, extra?.source ?? 'server', where.slice(0, 300), message, stack, page, actor?.userId ?? null, actor?.companyId ?? null,
      actor?.name ?? null, actor?.role ?? null, info.userAgent, JSON.stringify(details),
    ],
  )
  const to = process.env.ALERT_EMAIL
  if (!to || !isProduction()) return
  // claim the email (several servers never send the same one twice)
  const [claimed] = await query<{ count: number; since_email: number }>(
    `WITH old AS (SELECT fingerprint, since_email FROM error_log WHERE fingerprint = $1 FOR UPDATE)
     UPDATE error_log e SET emailed_at = now(), since_email = 0 FROM old
      WHERE e.fingerprint = old.fingerprint AND (e.emailed_at IS NULL OR e.emailed_at < now() - make_interval(mins => $2))
      RETURNING e.count, old.since_email`,
    [fingerprint, EMAIL_EVERY_MINUTES],
  )
  if (!claimed) return
  const host = new URL(appUrl('/')).host
  const who = actor ? `${actor.name} (user ${actor.userId}, ${actor.role}${actor.companyId ? `, school ${actor.companyId}` : ''})` : 'not signed in'
  const lines = [
    `Where:   ${where}`,
    `Source:  ${extra?.source ?? 'server'}`,
    `Page:    ${page ?? '—'}`,
    `User:    ${who}`,
    `Count:   ${claimed.since_email > 1 ? `${claimed.since_email} times since the last email, ` : ''}${claimed.count} in total`,
    `Browser: ${info.userAgent ?? '—'}`,
    `Time:    ${new Date().toISOString()}`,
    ...Object.entries(details).map(([k, v]) => `${(k + ':').padEnd(9)}${typeof v === 'object' ? JSON.stringify(v) : String(v)}`),
    '',
    message,
    '',
    stack,
    '',
    `All errors: ${appUrl('/admin/errors')}`,
  ]
  const text = lines.join('\n')
  await sendMail({
    to,
    subject: `[${host}] ${where}: ${err.message}`.slice(0, 180),
    text,
    html: `<pre style="font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)}</pre>`,
  })
}
