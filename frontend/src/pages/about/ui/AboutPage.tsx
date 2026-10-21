import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { PublicHero } from '@/shared/ui/public-hero'
import { getT } from '@/shared/i18n/server'

const VALUES: Array<{ key: 'learner' | 'simple' | 'trust' | 'open' | 'families' | 'teachers'; icon: IconName }> = [
  { key: 'learner', icon: 'spark' },
  { key: 'simple', icon: 'check' },
  { key: 'trust', icon: 'lock' },
  { key: 'open', icon: 'globe' },
  { key: 'families', icon: 'users' },
  { key: 'teachers', icon: 'book' },
]

/** Public: who we are, why Budu exists, and our values (#values). */
export async function AboutPage() {
  const t = await getT()
  const s = t.site.about
  return (
    <div className="flex flex-col gap-16">
      <PublicHero title={s.title} sub={s.sub} />
      <section className="mx-auto flex max-w-3xl flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{s.storyTitle}</h2>
        {s.story.map((p, i) => (
          <p key={i} className="leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </section>
      <section id="values" className="flex scroll-mt-24 flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">{s.valuesTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.key} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon name={v.icon} />
              </span>
              <h3 className="font-semibold">{s.values[v.key].title}</h3>
              <p className="text-sm text-muted-foreground">{s.values[v.key].text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/40 px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{s.ctaTitle}</h2>
        <p className="max-w-xl text-muted-foreground">{s.ctaSub}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">{s.ctaStart}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">{s.ctaContact}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
