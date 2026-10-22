import { LocalLink as Link } from '@/shared/ui/local-link'
import { SITE } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { PublicHero } from '@/shared/ui/public-hero'
import { getT } from '@/shared/i18n/server'

/**
 * Public: plans (owner) — students always free; teachers free (AI features paid later); schools free
 * up to SITE.freeSchool, then a quote (B2B → Contact, topic "school").
 */
export async function PricingPage() {
  const t = await getT()
  const s = t.site.pricing
  const plans = [
    { key: 'students', ...s.students, note: s.students.note, href: '/register', highlight: false },
    { key: 'teachers', ...s.teachers, note: s.teachers.note, href: '/register', highlight: false },
    { key: 'schools', ...s.schools, note: s.schools.note(SITE.freeSchool.teachers, SITE.freeSchool.students), href: '/contact?topic=school', highlight: true },
  ]
  return (
    <div className="flex flex-col gap-14">
      <PublicHero title={s.title} sub={s.sub} />
      <section className="grid gap-5 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.key}
            className={cn('flex flex-col gap-5 rounded-2xl border bg-card p-6', p.highlight && 'border-primary/40 shadow-md ring-1 ring-primary/20')}
          >
            <div>
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{p.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Icon name="tick" className="mt-0.5 size-4 flex-none text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            {'bigger' in p && <p className="text-sm text-muted-foreground">{p.bigger}</p>}
            <Button variant={p.highlight ? 'default' : 'outline'} className="w-full" asChild>
              <Link href={p.href}>{p.cta}</Link>
            </Button>
          </div>
        ))}
      </section>
      <p className="text-center text-sm text-muted-foreground">{s.paidCourses}</p>
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">{s.faqTitle}</h2>
        {s.faq.map((f) => (
          <details key={f.q} className="group rounded-xl border bg-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {f.q}
              <Icon name="down" className="size-4 flex-none text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  )
}
