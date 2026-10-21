import Link from 'next/link'
import { ReactNode } from 'react'
import { getSession } from '@/entities/session/server'
import { getCurrency, visitorCurrency } from '@/entities/user/server'
import { CurrencyPicker } from '@/features/switch-currency'
import { LanguageMenu } from '@/features/switch-language'
import { Button } from '@/shared/ui/button'
import { BrandMark } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/**
 * Public pages anyone can open without an account (the course catalog): a slim header with the
 * Budu mark, language and currency, and Sign in / Sign up — or "Open Budu" when signed in.
 */
export async function PublicLayout({ children }: { children: ReactNode }) {
  const [t, user] = await Promise.all([getT(), getSession()])
  const currency = user ? await getCurrency(user.userId) : await visitorCurrency()
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BrandMark />
            {t.appName}
          </Link>
          <nav className="ms-4 hidden sm:block">
            <Link href="/catalog" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t.landing.navCourses}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <CurrencyPicker value={currency} compact />
            <LanguageMenu />
            {user ? (
              <Button size="sm" asChild>
                <Link href="/">{t.catalog.openApp}</Link>
              </Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/login">{t.catalog.signIn}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">{t.catalog.signUp}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
