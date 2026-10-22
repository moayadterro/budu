/**
 * UI strings in English, Russian and Arabic. Client components: `const t = useT()`.
 * Server components / server code: `const t = await getT()` from '@/shared/i18n/server'.
 * Every string lives in en.ts; ru.ts and ar.ts must have the same keys (TypeScript checks).
 */
export { I18nProvider, useLocale, useT } from './provider'
export {
  LANGUAGES,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  LOCALE_NAMES,
  DEFAULT_LOCALE,
  dirOf,
  isLocale,
  isLocalizedPath,
  localeHref,
  localePath,
  splitLocale,
  type Language,
  type Locale,
} from './config'
export type { Messages } from './messages'
