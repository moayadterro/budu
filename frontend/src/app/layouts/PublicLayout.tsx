import { ReactNode } from 'react'
import { getSession } from '@/entities/session/server'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'

/**
 * Public pages anyone can open without an account (catalog, schools, about …): the floating header
 * (logo, sections, theme, language, Sign in / Sign up — or "Open Budu" when signed in) and the footer.
 */
export async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await getSession()
  return (
    <div className="min-h-svh bg-background">
      <PublicHeader signedIn={!!user} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <PublicFooter />
    </div>
  )
}
