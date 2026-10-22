'use client'

import { DEFAULT_LOCALE, dirOf, isLocale, LOCALE_COOKIE, type Locale } from '@/shared/i18n'
import { MESSAGES } from '@/shared/i18n/messages'
import { ErrorScreen } from './ErrorScreen'

/**
 * Shown only when the root layout itself crashed: there is no strings provider then, so the
 * language comes straight from the cookie (the one place a dictionary is picked by hand).
 */
export function GlobalErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const fromCookie = typeof document === 'undefined' ? null : document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))?.[1]
  const locale: Locale = fromCookie && isLocale(fromCookie) ? fromCookie : DEFAULT_LOCALE
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="bg-background text-foreground">
        <ErrorScreen t={MESSAGES[locale]} error={error} reset={reset} />
      </body>
    </html>
  )
}
