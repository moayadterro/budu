import { LocalLink as Link } from '@/shared/ui/local-link'
import { Logo } from '@/shared/ui/logo'
import { getT } from '@/shared/i18n/server'

/** The public pages' footer: what Budu is, then Product · Company · Help links. */
export async function PublicFooter() {
  const t = await getT()
  const s = t.site.footer
  const l = s.links
  const columns = [
    { title: s.product, links: [{ href: '/catalog', label: l.courses }, { href: '/pricing', label: l.pricing }, { href: '/schools', label: l.schools }] },
    { title: s.company, links: [{ href: '/about', label: l.about }, { href: '/about#values', label: l.values }, { href: '/contact', label: l.contact }] },
    { title: s.help, links: [{ href: '/help', label: l.support }, { href: '/privacy', label: l.privacy }] },
  ]
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo className="h-7 w-auto" label={t.appName} />
          <p className="max-w-xs text-sm text-muted-foreground">{s.tagline}</p>
        </div>
        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title} className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold">{c.title}</p>
            {c.links.map((x) => (
              <Link key={x.href} href={x.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {x.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground">{s.rights(new Date().getFullYear())}</p>
      </div>
    </footer>
  )
}
