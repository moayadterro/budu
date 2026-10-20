import { LOCALE_NAMES, type Locale } from '@/shared/i18n'

/**
 * Name of a language in the current UI language ("Arabic" / "арабский" / "العربية"),
 * from the browser's Intl data — so new languages need no extra translation strings.
 */
export function localizedName(code: Locale, uiLocale: Locale) {
  try {
    return new Intl.DisplayNames([uiLocale], { type: 'language' }).of(code) ?? LOCALE_NAMES[code]
  } catch {
    return LOCALE_NAMES[code]
  }
}

/** Secondary label shown under/next to the native name, or null when they're the same. */
export function secondaryName(code: Locale, uiLocale: Locale) {
  const name = localizedName(code, uiLocale)
  return name.toLowerCase() === LOCALE_NAMES[code].toLowerCase() ? null : name
}
