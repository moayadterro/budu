'use client'

import { LocalLink as Link } from '@/shared/ui/local-link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ThemeSegment, ThemeToggle } from '@/features/switch-theme'
import { LanguageMenu, LanguageSheet } from '@/features/switch-language'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Logo } from '@/shared/ui/logo'
import { cn } from '@/shared/lib/cn'
import { splitLocale, useT } from '@/shared/i18n'

const NAV = [
  { key: 'courses', href: '/catalog' },
  { key: 'pricing', href: '/pricing' },
  { key: 'schools', href: '/schools' },
  { key: 'about', href: '/about' },
] as const

/**
 * The public site's header: a floating island. On top of the page it lies flat on the background;
 * once the page scrolls it turns into frosted glass with a soft shadow (no full-width border line).
 * The current section has a soft highlight that slides between links; on phones the links, Sign in,
 * theme and language open from a menu button inside the same island.
 */
export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  const t = useT()
  const pathname = splitLocale(usePathname() ?? '/').path // "/ru/pricing" → "/pricing"
  const reduce = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const active = NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))?.href
  const raised = scrolled || open

  return (
    // the header keeps one bar's height in the page; the island is laid over it, so the open menu
    // floats above the content instead of pushing it down
    <header className="sticky top-0 z-30 h-[4.25rem] sm:h-[5.25rem]">
      <div
        className={cn(
          'absolute inset-x-3 top-3 mx-auto max-w-6xl rounded-2xl sm:inset-x-4 sm:top-4 transition-[background-color,box-shadow,backdrop-filter] duration-300',
          raised ? 'bg-background/75 shadow-lg ring-1 shadow-foreground/5 ring-foreground/8 backdrop-blur-xl backdrop-saturate-150' : 'bg-transparent',
        )}
      >
        <div className="flex h-14 items-center gap-1 ps-3 pe-2 sm:h-16 sm:gap-2 sm:px-6">
          <Link href="/" className="me-2 flex items-center rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" aria-label={t.appName}>
            <Logo className="h-7 w-auto" label={t.appName} />
          </Link>

          <nav className="hidden items-center md:flex" aria-label={t.appName}>
            {NAV.map((n) => {
              const on = active === n.href
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative isolate rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="public-nav-active"
                      transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.2, duration: 0.45 }}
                      className="absolute inset-0 -z-10 rounded-lg bg-foreground/6"
                    />
                  )}
                  {t.site.nav[n.key]}
                </Link>
              )
            })}
          </nav>

          <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
            <div className="hidden items-center gap-0.5 md:flex">
              <ThemeToggle />
              <LanguageMenu />
            </div>
            {signedIn ? (
              <CtaButton href="/">{t.catalog.openApp}</CtaButton>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden text-muted-foreground hover:text-foreground md:inline-flex" asChild>
                  <Link href="/login">{t.catalog.signIn}</Link>
                </Button>
                <CtaButton href="/register">{t.catalog.signUp}</CtaButton>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-expanded={open}
              aria-label={open ? t.site.closeMenu : t.site.menu}
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name={open ? 'close' : 'menu'} className="size-5" />
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              key="menu"
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden md:hidden"
              aria-label={t.appName}
            >
              <div className="flex flex-col gap-1 px-2 pt-1 pb-3">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active === n.href ? 'page' : undefined}
                    className={cn(
                      'flex h-12 items-center justify-between rounded-xl px-3 text-base font-medium transition-colors',
                      active === n.href ? 'bg-foreground/6 text-foreground' : 'text-muted-foreground hover:bg-foreground/4 hover:text-foreground',
                    )}
                  >
                    {t.site.nav[n.key]}
                    <Icon name="chevRight" className="size-4 opacity-50 rtl:rotate-180" />
                  </Link>
                ))}
                {!signedIn && (
                  <Button variant="outline" className="mt-2 h-12 rounded-xl text-base" asChild>
                    <Link href="/login">{t.catalog.signIn}</Link>
                  </Button>
                )}
                <div className="mt-3 flex flex-col gap-3 border-t border-foreground/8 px-1 pt-4">
                  <MenuSetting label={t.account.theme}>
                    <ThemeSegment />
                  </MenuSetting>
                  <MenuSetting label={t.account.language}>
                    <LanguageSheet />
                  </MenuSetting>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

/** A labelled setting in the phone menu. */
function MenuSetting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-1 text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/** The one green action: an arrow that slides forward on hover (mirrored in Arabic). */
function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button size="sm" className="group ms-1 gap-1.5 rounded-lg ps-3.5 pe-3 shadow-sm shadow-primary/25" asChild>
      <Link href={href}>
        {children}
        <Icon name="forward" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </Link>
    </Button>
  )
}
