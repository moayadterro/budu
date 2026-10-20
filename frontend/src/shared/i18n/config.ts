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

/** Best supported match for an Accept-Language header ("ru-RU,ru;q=0.9,en;q=0.8" → "ru"). */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  for (const part of (acceptLanguage ?? '').split(',')) {
    const code = part.trim().split(';')[0].split('-')[0].toLowerCase()
    if (isLocale(code)) return code
  }
  return DEFAULT_LOCALE
}
