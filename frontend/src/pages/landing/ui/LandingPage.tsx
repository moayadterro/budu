import { LocalLink as Link } from '@/shared/ui/local-link'
import { visitorCurrency } from '@/entities/user/server'
import { CatalogGrid } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'
import { JoinInvite } from '@/widgets/school-invite'
import { AudienceCards } from './AudienceCards'

const AUDIENCES = ['schools', 'teachers', 'students', 'parents'] as const

/** Budu's front door: what it is, who it's for, a few courses, sign up. For everyone, signed in too (owner); the app itself is at /start. */
export async function LandingPage() {
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

      {/* who it's for: four living cards, two per row */}
      <section className="flex flex-col gap-10">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{s.forTitle}</h2>
        <AudienceCards items={AUDIENCES.map((key) => ({ key, title: s.for[key].title, text: s.for[key].text }))} />
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

      {/* closing invitation for everyone (students, teachers, schools), the twin of SchoolInvite */}
      <JoinInvite className="mt-4 sm:mt-8" />
    </div>
  )
}
