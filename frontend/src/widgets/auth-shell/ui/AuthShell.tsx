import Link from 'next/link'
import { ReactNode } from 'react'
import { LanguageMenu } from '@/features/switch-language'
import { ThemeToggle } from '@/features/switch-theme'
import { cn } from '@/shared/lib/cn'
import { Icon, type IconName } from '@/shared/ui/icon'
import { Logo } from '@/shared/ui/logo'
import { Appear } from '@/shared/ui/motion'
import { getT } from '@/shared/i18n/server'

const POINTS: Array<{ key: 'schools' | 'teachers' | 'parents'; icon: IconName }> = [
  { key: 'schools', icon: 'layers' },
  { key: 'teachers', icon: 'book' },
  { key: 'parents', icon: 'users' },
]

/**
 * Every auth screen (sign in, register, reset …). Desktop: a split screen — the form on a clean
 * surface (no boxed card), and a brand panel with Budu's promise. Phones: the form alone, full width.
 * `back` puts "← Back to …" above the title (e.g. back to sign in from "Forgot password").
 */
export async function AuthShell({
  title,
  sub,
  back,
  wide,
  children,
}: {
  title: string
  sub?: ReactNode
  back?: { href: string; label: string }
  wide?: boolean
  children: ReactNode
}) {
  const t = await getT()
  const l = t.landing
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col px-5 pt-4 pb-6 sm:px-10">
        <header className="flex h-12 items-center justify-between gap-3">
          <Link href="/" aria-label={t.appName} className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo className="h-8 w-auto" label={t.appName} />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageMenu />
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center py-10 sm:items-center">
          <Appear className={cn('w-full', wide ? 'max-w-lg' : 'max-w-sm')}>
            {back && (
              <Link
                href={back.href}
                className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon name="back" className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:translate-x-0.5" />
                {back.label}
              </Link>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
            {sub && <p className="mt-2 text-pretty text-muted-foreground">{sub}</p>}
            <div className="mt-8">{children}</div>
          </Appear>
        </main>

        <footer className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <Link href="/help" className="hover:text-foreground">
            {t.site.footer.links.support}
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            {t.site.footer.links.privacy}
          </Link>
          <span>{t.site.footer.rights(new Date().getFullYear())}</span>
        </footer>
      </div>

      {/* brand panel — desktop only */}
      <aside className="relative m-3 hidden overflow-hidden rounded-3xl bg-brand p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div aria-hidden className="pointer-events-none absolute -top-24 -end-24 size-80 rounded-full bg-highlight/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -start-16 size-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -end-10 -bottom-8 opacity-[0.12]">
          <Logo mark className="size-72 [&_g]:fill-primary-foreground" />
        </div>

        <span className="relative w-fit rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur">{l.badge}</span>
        <div className="relative flex max-w-md flex-col gap-8">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance">{l.title}</h2>
          <ul className="flex flex-col gap-5">
            {POINTS.map((p) => (
              <li key={p.key} className="flex items-start gap-3">
                <span className="grid size-9 flex-none place-items-center rounded-xl bg-primary-foreground/15 backdrop-blur">
                  <Icon name={p.icon} className="size-4.5" />
                </span>
                <span>
                  <span className="block font-semibold">{l.for[p.key].title}</span>
                  <span className="block text-sm opacity-85">{l.for[p.key].text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-80">{t.site.footer.tagline}</p>
      </aside>
    </div>
  )
}
