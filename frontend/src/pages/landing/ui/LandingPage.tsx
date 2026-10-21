import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { visitorCurrency } from '@/entities/user/server'
import { CatalogGrid } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { homeFor } from '@/shared/config/nav'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

const AUDIENCES: Array<{ key: 'schools' | 'teachers' | 'students' | 'parents'; icon: IconName }> = [
  { key: 'schools', icon: 'layers' },
  { key: 'teachers', icon: 'book' },
  { key: 'students', icon: 'spark' },
  { key: 'parents', icon: 'users' },
]

/** Budu's front door for visitors: what it is, who it's for, a few courses, sign up. Signed-in users go home. */
export async function LandingPage() {
  const user = await getSession()
  if (user) redirect(homeFor(user.role))
  const t = await getT()
  const s = t.landing
  const featured = (await catalogFor(0, await visitorCurrency())).slice(0, 6)
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 rounded-3xl bg-brand px-6 py-16 text-center text-primary-foreground sm:px-12">
        <span className="rounded-full bg-background/15 px-3 py-1 text-xs font-medium">{s.badge}</span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{s.title}</h1>
        <p className="max-w-2xl text-lg opacity-90 text-balance">{s.sub}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="highlight" asChild>
            <Link href="/catalog">{s.browse}</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-background/10 hover:text-primary-foreground" asChild>
            <Link href="/register">{s.start}</Link>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">{s.forTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <div key={a.key} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon name={a.icon} />
              </span>
              <h3 className="font-semibold">{s.for[a.key].title}</h3>
              <p className="text-sm text-muted-foreground">{s.for[a.key].text}</p>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{s.coursesTitle}</h2>
              <p className="text-muted-foreground">{s.coursesSub}</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/catalog">
                {s.allCourses}
                <Icon name="chevRight" className="rtl:-scale-x-100" />
              </Link>
            </Button>
          </div>
          <CatalogGrid items={featured} hrefBase="/catalog" />
        </section>
      )}

      <section className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/40 px-6 py-12 text-center">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance">{s.ctaTitle}</h2>
        <p className="max-w-xl text-muted-foreground">{s.ctaSub}</p>
        <Button size="lg" asChild>
          <Link href="/register">{s.start}</Link>
        </Button>
      </section>
    </div>
  )
}
