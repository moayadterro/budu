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

/**
 * Moodle builds per-course caches on first use and takes a lock to do it; when several requests hit
 * a fresh cache at once, the losers fail with this instead of waiting. It happens before the function
 * does anything, so it is safe to retry.
 */
const CACHE_LOCK = /unable to acquire a lock for caching/i
const LOCK_RETRIES = 3

export async function iomadCall<T>(inst: IomadInstance, fn: string, params: Record<string, unknown> = {}): Promise<T> {
  // POST body, not query string, so the token stays out of access logs
  const body = new URLSearchParams({ wstoken: inst.token, wsfunction: fn, moodlewsrestformat: 'json' })
  for (const [k, v] of Object.entries(params)) flatten(v, k, body)

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${inst.url}/webservice/rest/server.php`, { method: 'POST', body, cache: 'no-store' })
    if (!res.ok) throw new IomadError('http', `IOMAD ${fn}: HTTP ${res.status}`)

    const data = await res.json()
    // Moodle reports errors as HTTP 200 with an exception payload
    if (data && typeof data === 'object' && 'exception' in data) {
      if (CACHE_LOCK.test(String(data.message)) && attempt < LOCK_RETRIES) {
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)))
        continue
      }
      throw new IomadError(data.errorcode ?? 'exception', `IOMAD ${fn}: ${data.message}`)
    }
    return data as T
  }
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

/**
 * Uploads a file into the integration user's draft area (webservice/upload.php)
 * and returns the draft item id, which a local_budu function then moves into
 * the course (lesson material, task attachment, homework answer). Pass the id
 * back in to add more files to the same draft.
 */
export async function iomadUpload(inst: IomadInstance, file: File, draftItemId = 0): Promise<number> {
  const body = new FormData()
  body.append('token', inst.token)
  body.append('filearea', 'draft')
  body.append('itemid', String(draftItemId)) // reuse a draft area to collect several files
  body.append('file_1', file, file.name)
  const res = await fetch(`${inst.url}/webservice/upload.php`, { method: 'POST', body, cache: 'no-store' })
  if (!res.ok) throw new IomadError('http', `IOMAD upload: HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data) || !data[0]?.itemid) {
    throw new IomadError(data?.errorcode ?? 'upload', `IOMAD upload: ${data?.error ?? data?.message ?? 'failed'}`)
  }
  return data[0].itemid as number
}

/**
 * Fetches a course file from webservice/pluginfile.php (token in the POST body).
 * `range` is passed through, so videos can seek (206 Partial Content).
 * The caller must have checked access first (local_budu_file_access).
 */
export function iomadFile(inst: IomadInstance, path: string, range?: string | null) {
  return fetch(`${inst.url}/webservice/pluginfile.php${path}`, {
    method: 'POST',
    body: new URLSearchParams({ token: inst.token }),
    headers: range ? { Range: range } : {},
    cache: 'no-store',
  })
}
