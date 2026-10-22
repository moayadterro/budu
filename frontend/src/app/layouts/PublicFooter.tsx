import { LocalLink as Link } from '@/shared/ui/local-link'
import { Logo } from '@/shared/ui/logo'
import { getT } from '@/shared/i18n/server'

/** Footer links share the header's quiet style: muted text, a soft highlight on hover. */
const LINK =
  '-mx-2 w-fit rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'

/**
 * The public pages' footer, in the header's language: no border lines — the soft muted band, the
 * logo and what Budu is, Product · Company · Help, then a quiet last line with © and the legal pages.
 */
export async function PublicFooter() {
  const t = await getT()
  const s = t.site.footer
  const l = s.links
  const columns = [
    { title: s.product, links: [{ href: '/catalog', label: l.courses }, { href: '/pricing', label: l.pricing }, { href: '/schools', label: l.schools }] },
    { title: s.company, links: [{ href: '/about', label: l.about }, { href: '/about#values', label: l.values }] },
    { title: s.help, links: [{ href: '/help', label: l.support }, { href: '/contact', label: l.contact }] },
  ]
  return (
    <footer className="mt-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-6">
        <div className="grid gap-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4 sm:col-span-3 lg:col-span-1">
            <Link href="/" aria-label={t.appName} className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <Logo className="h-10 w-auto" label={t.appName} />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{s.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:col-span-3 sm:grid-cols-3 lg:col-span-3">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex flex-col gap-1">
                <p className="mb-2 text-sm font-semibold">{c.title}</p>
                {c.links.map((x) => (
                  <Link key={x.href} href={x.href} className={LINK}>
                    {x.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="py-1.5 text-xs text-muted-foreground">{s.rights(new Date().getFullYear())}</p>
          <nav aria-label={`${l.privacy} · ${l.terms}`} className="flex flex-wrap gap-x-3">
            <Link href="/privacy" className={LINK.replace('text-sm', 'text-xs')}>
              {l.privacy}
            </Link>
            <Link href="/terms" className={LINK.replace('text-sm', 'text-xs')}>
              {l.terms}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
