import 'server-only'
/**
 * IOMAD (Moodle) Web Services REST client. SERVER-SIDE ONLY: it uses the
 * integration token, which must never reach the browser.
 *
 * Every call takes the IOMAD instance explicitly, so a tenant record
 * (iomad_url + company_id) can live on any instance (shard-ready).
 */

export type IomadInstance = { url: string; token: string }

/** The instance this deployment talks to (the compose `iomad` service). */
export function defaultInstance(): IomadInstance {
  const url = process.env.IOMAD_API_URL
  const token = process.env.IOMAD_WS_TOKEN
  if (!url || !token) throw new Error('IOMAD_API_URL / IOMAD_WS_TOKEN are not set')
  return { url, token }
}

export class IomadError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

/** Moodle's REST format wants nested params flattened: users[0][email]=… */
function flatten(value: unknown, key: string, out: URLSearchParams) {
  if (value === undefined || value === null) return
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) flatten(v, `${key}[${k}]`, out)
  } else {
    out.append(key, String(value))
  }
}

export async function iomadCall<T>(inst: IomadInstance, fn: string, params: Record<string, unknown> = {}): Promise<T> {
  // POST body, not query string, so the token stays out of access logs
  const body = new URLSearchParams({ wstoken: inst.token, wsfunction: fn, moodlewsrestformat: 'json' })
  for (const [k, v] of Object.entries(params)) flatten(v, k, body)

  const res = await fetch(`${inst.url}/webservice/rest/server.php`, { method: 'POST', body, cache: 'no-store' })
  if (!res.ok) throw new IomadError('http', `IOMAD ${fn}: HTTP ${res.status}`)

  const data = await res.json()
  // Moodle reports errors as HTTP 200 with an exception payload
  if (data && typeof data === 'object' && 'exception' in data) {
    throw new IomadError(data.errorcode ?? 'exception', `IOMAD ${fn}: ${data.message}`)
  }
  return data as T
}

/**
 * Checks a password with Moodle's own authentication (lockout, suspension,
 * failed-login logging) via the local_budu plugin. Works for every account,
 * site admins included, and never starts a Moodle session.
 */
export async function iomadCheckPassword(inst: IomadInstance, username: string, password: string) {
  return iomadCall<{ ok: boolean; reason: 'ok' | 'invalid' | 'suspended' | 'locked' }>(inst, 'local_budu_check_password', {
    username,
    password,
  })
}