/**
 * Supported UI languages — the ONE list. Adding a language (up to ~10 planned):
 *   1. add an entry here (ISO 639-1 code, native name, text direction),
 *   2. add `<code>.ts` next to en.ts typed `typeof en` and register it in messages.ts,
 *   3. if its script needs another font, add a `:root[lang='<code>']` rule in theme/tokens.css
 *      and the font to RootLayout's Google Fonts link.
 * Pickers, <html lang/dir>, RTL layout and Accept-Language matching all follow this list.
 */
export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
] as const satisfies ReadonlyArray<{ code: string; name: string; dir: 'ltr' | 'rtl' }>

export type Language = (typeof LANGUAGES)[number]
export type Locale = Language['code']

export const LOCALES: Locale[] = LANGUAGES.map((l) => l.code)
export const DEFAULT_LOCALE: Locale = 'en'

/** Cookie holding the chosen language (set from Settings; otherwise the browser's language is used). */
export const LOCALE_COOKIE = 'budu_locale'

/** Native names, shown in the language pickers. */
export const LOCALE_NAMES = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.name])) as Record<Locale, string>

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as string[]).includes(v)
export const dirOf = (locale: Locale): 'ltr' | 'rtl' => LANGUAGES.find((l) => l.code === locale)?.dir ?? 'ltr'

/**
 * The browser's PREFERRED language if Budu has it, else English (owner: an unsupported first
 * language — German, French … — opens English, never a lower-ranked fallback like Russian).
 * "ru-RU,ru;q=0.9,en;q=0.8" → "ru" · "de-DE,de;q=0.9,ru;q=0.5" → "en".
 */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part, i) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.trim().slice(2) ?? 1)
      return { code: tag.split('-')[0]!.toLowerCase(), q: Number.isFinite(q) ? q : 0, i }
    })
    .filter((x) => x.code && x.code !== '*' && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
  const first = ranked[0]?.code
  return isLocale(first) ? first : DEFAULT_LOCALE
}

/**
 * SEO: the public pages exist in every language — English (the default) at /x, every other language
 * at /<code>/x (/ru/pricing, /ar/schools/…). The URL then decides the language (the proxy passes it
 * on in LOCALE_HEADER). Signed-in screens and auth pages are not localized by URL.
 */
export const LOCALIZED_PATHS = ['/catalog', '/schools', '/pricing', '/about', '/help', '/contact', '/privacy']
export const LOCALE_HEADER = 'x-budu-locale'

export const isLocalizedPath = (path: string) =>
  path === '/' || LOCALIZED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

/** The address of `path` in `locale`: "/pricing" → "/ru/pricing"; English stays "/pricing". */
export const localePath = (path: string, locale: Locale) =>
  locale === DEFAULT_LOCALE || !isLocalizedPath(path) ? path : `/${locale}${path === '/' ? '' : path}`

/** "/ru/pricing" → { locale: "ru", path: "/pricing" }; "/pricing" → { locale: null, path: "/pricing" }. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const first = pathname.split('/')[1]
  return isLocale(first) ? { locale: first, path: pathname.slice(first.length + 1) || '/' } : { locale: null, path: pathname }
}

/** localePath for a link that may carry ?query or #hash: "/contact?topic=school" → "/ru/contact?topic=school". */
export function localeHref(href: string, locale: Locale) {
  if (!href.startsWith('/')) return href
  const i = href.search(/[?#]/)
  return i < 0 ? localePath(href, locale) : localePath(href.slice(0, i), locale) + href.slice(i)
}
