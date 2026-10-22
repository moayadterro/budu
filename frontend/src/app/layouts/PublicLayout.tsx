import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import { getSession } from '@/entities/session/server'
import { isLocale } from '@/shared/i18n'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'

/**
 * Public pages anyone can open without an account (catalog, schools, about …): the floating header
 * (logo, sections, theme, language, Sign in / Sign up — or "Open Budu" when signed in) and the footer.
 */
export async function PublicLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  // the route is /[lang]/…: only real languages (the proxy maps English addresses to /en/…)
  if (!isLocale((await params).lang)) notFound()
  const user = await getSession()
  return (
    <div className="min-h-svh bg-background">
      <PublicHeader signedIn={!!user} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <PublicFooter />
    </div>
  )
}
