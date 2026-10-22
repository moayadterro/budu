import { LocalLink as Link } from '@/shared/ui/local-link'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { PublicHero } from '@/shared/ui/public-hero'
import { getT } from '@/shared/i18n/server'

/** Public: Help & support — common questions by topic, then "write to us". */
export async function HelpPage() {
  const t = await getT()
  const s = t.site.help
  const groups = [s.groups.start, s.groups.students, s.groups.teachers, s.groups.payments]
  return (
    <div className="flex flex-col gap-12">
      <PublicHero title={s.title} sub={s.sub} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        {groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{g.title}</h2>
            {g.items.map((f) => (
              <details key={f.q} className="group rounded-xl border bg-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <Icon name="down" className="size-4 flex-none text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </section>
        ))}
        <section className="flex flex-col items-center gap-3 rounded-2xl border bg-muted/40 px-6 py-10 text-center">
          <h2 className="text-xl font-semibold tracking-tight">{s.stillTitle}</h2>
          <p className="text-muted-foreground">{s.stillSub}</p>
          <Button asChild>
            <Link href="/contact?topic=support">{s.contact}</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
