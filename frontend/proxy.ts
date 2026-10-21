import { NextRequest, NextResponse } from 'next/server'
import { PUBLIC_PATHS, SESSION_COOKIE } from '@/shared/config/auth'

/**
 * Next 16 proxy (formerly middleware). Fast gate: no session cookie → sign-in
 * page. The cookie itself is validated against Postgres in the app shell
 * (AppShell → getSession), which also handles expiry and revocation.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  // "/" is the public landing page (signed-in users are sent home by the page itself)
  if (pathname === '/' || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next()
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  // everything except Next internals and static files
  matcher: ['/((?!_next/|favicon.ico|.*\\..*).*)'],
}
