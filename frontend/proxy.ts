import { NextRequest, NextResponse } from 'next/server'
import { PUBLIC_PATHS, SESSION_COOKIE } from '@/shared/config/auth'
import { DEFAULT_LOCALE, isLocale, isLocalizedPath, LOCALE_COOKIE, LOCALE_HEADER, localePath, matchLocale, splitLocale, type Locale } from '@/shared/i18n/config'

// Search engines are never redirected by language (Yandex sends a Russian Accept-Language): every
// address shows the same content to everyone, so this is not cloaking — it lets them index each one.
const CRAWLER = /bot|crawl|spider|slurp|yandex|bingpreview|facebookexternalhit|embedly|telegram|whatsapp|vkshare/i

/**
 * Next 16 proxy (formerly middleware).
 * 1. Public pages by language (SEO): /ru/… and /ar/… are served by the app/(public)/[lang] routes;
 *    English lives at /… (internally /en/…; /en/… saves English as the choice and redirects to /…). Visitors (not crawlers) on
 *    an English address whose chosen or browser language is another one are sent to that version;
 *    opening a /ru/… address makes Russian their chosen language (cookie).
 * 2. Fast sign-in gate: no session cookie → sign-in page. The cookie itself is validated against
 *    Postgres in the app shell (AppShell → getSession), which also handles expiry and revocation.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  const { locale, path } = splitLocale(pathname)
  if (locale) {
    // a language prefix on a non-public page means nothing
    if (!isLocalizedPath(path)) return redirect(req, path + search)
    // the address's language beats the saved one: opening /ru/… (or /en/…) = choosing it — remember
    // it, so English addresses, sign-in and the app continue in it. /en/x then lives at /x.
    const res = locale === DEFAULT_LOCALE ? redirect(req, path + search) : withLocale(req, locale)
    if (req.cookies.get(LOCALE_COOKIE)?.value !== locale && !CRAWLER.test(req.headers.get('user-agent') ?? '')) {
      res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 365 * 24 * 60 * 60, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
    }
    return res
  }
  if (isLocalizedPath(pathname)) {
    const wanted = preferredLocale(req)
    if (wanted !== DEFAULT_LOCALE) return redirect(req, localePath(pathname, wanted) + search)
    const url = req.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
    return withLocale(req, DEFAULT_LOCALE, url)
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) || req.cookies.has(SESSION_COOKIE)) return pass(req)

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

/** The visitor's language for an English address: their choice (cookie), else the browser's; crawlers get English. */
function preferredLocale(req: NextRequest): Locale {
  if (CRAWLER.test(req.headers.get('user-agent') ?? '')) return DEFAULT_LOCALE
  const chosen = req.cookies.get(LOCALE_COOKIE)?.value
  if (isLocale(chosen)) return chosen
  return matchLocale(req.headers.get('accept-language'))
}

/** Serve the page (optionally from an internal path) and tell getLocale() the URL's language. */
function withLocale(req: NextRequest, locale: Locale, rewriteTo?: URL) {
  const headers = new Headers(req.headers)
  headers.set(LOCALE_HEADER, locale)
  return rewriteTo ? NextResponse.rewrite(rewriteTo, { request: { headers } }) : NextResponse.next({ request: { headers } })
}

/** Carry on — without a language header someone may have sent themselves (only the proxy sets it). */
function pass(req: NextRequest) {
  if (!req.headers.has(LOCALE_HEADER)) return NextResponse.next()
  const headers = new Headers(req.headers)
  headers.delete(LOCALE_HEADER)
  return NextResponse.next({ request: { headers } })
}

function redirect(req: NextRequest, to: string) {
  return NextResponse.redirect(new URL(to, req.url))
}

export const config = {
  // everything except Next internals and static files
  matcher: ['/((?!_next/|favicon.ico|.*\\..*).*)'],
}
