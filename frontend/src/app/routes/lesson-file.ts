import 'server-only'
import { lessonFileAccess } from '@/entities/course/server'
import { getSession } from '@/entities/session/server'
import { defaultInstance, iomadFile } from '@/shared/server/iomad'

/**
 * GET /files/:fileId — streams a lesson file (video, PDF, task attachment, course cover) from IOMAD.
 * The ONE route handler in the app (CLAUDE.md → Decision log): server actions
 * can't stream video with seeking. Access is decided by IOMAD for the signed-in
 * user (local_budu_file_access) — visitors only get covers of published courses (the public
 * catalog); the token never reaches the browser.
 *
 * Uploaded files are untrusted: only media/PDF are shown inline; everything else
 * downloads, and the sandbox CSP stops any HTML/SVG from running on our origin.
 */

const INLINE = /^(video\/|audio\/|image\/(png|jpeg|gif|webp)$|application\/pdf$)/
const PASS = ['content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']

export async function GET(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await getSession()
  const fileId = Number((await params).fileId)
  if (!Number.isSafeInteger(fileId) || fileId <= 0) return new Response('Not found', { status: 404 })

  // visitors (no session) ask as user 0: IOMAD allows them only the covers of published courses
  const access = await lessonFileAccess(user?.userId ?? 0, fileId)
  if (!access.allowed) return new Response('Not found', { status: 404 })

  const upstream = await iomadFile(defaultInstance(), access.path, req.headers.get('range'))
  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.status === 416 ? 'Range not satisfiable' : 'Not available', {
      status: upstream.status === 416 ? 416 : 502,
    })
  }

  const inline = INLINE.test(access.mime)
  const headers = new Headers({
    'Content-Type': inline ? access.mime : 'application/octet-stream',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(access.name)}`,
    'Cache-Control': user ? 'private, max-age=300' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'",
  })
  for (const h of PASS) {
    const v = upstream.headers.get(h)
    if (v) headers.set(h, v)
  }
  return new Response(upstream.body, { status: upstream.status, headers })
}
