/** Supported UI languages. Adding one: a dictionary next to en.ts typed `Messages`, then list it here. */
export const LOCALES = ['en', 'ru', 'ar'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** Cookie holding the chosen language (set from Settings; otherwise the browser's language is used). */
export const LOCALE_COOKIE = 'budu_locale'

/** Native names, shown in the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', ru: 'Русский', ar: 'العربية' }

export const dirOf = (locale: Locale) => (locale === 'ar' ? 'rtl' : 'ltr')
export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

/** Best supported match for an Accept-Language header ("ru-RU,ru;q=0.9,en;q=0.8" → "ru"). */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  for (const part of (acceptLanguage ?? '').split(',')) {
    const code = part.trim().split(';')[0].split('-')[0].toLowerCase()
    if (isLocale(code)) return code
  }
  return DEFAULT_LOCALE
}
