import { LocalLink as Link } from '@/shared/ui/local-link'
import { visitorCurrency } from '@/entities/user/server'
import { CatalogGrid, CourseSpotlight } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'
import { JoinInvite } from '@/widgets/school-invite'
import { AudienceCards } from './AudienceCards'
import { HomeHero } from './HomeHero'

const AUDIENCES = ['schools', 'teachers', 'students', 'parents'] as const

/** Budu's front door: what it is, who it's for, a few courses, sign up. For everyone, signed in too (owner); the app itself is at /start. */
export async function LandingPage() {
  const t = await getT()
  const s = t.landing
  const featured = (await catalogFor(0, await visitorCurrency())).slice(0, 6)
  return (
    <div className="flex flex-col gap-16">
      <HomeHero
        badge={s.badge}
        title={s.title}
        sub={s.sub}
        start={s.start}
        browse={s.browse}
        chips={s.chips}
      />

      {/* who it's for: four living cards, two per row */}
      <section className="flex flex-col gap-10">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{s.forTitle}</h2>
        <AudienceCards items={AUDIENCES.map((key) => ({ key, title: s.for[key].title, text: s.for[key].text }))} />
      </section>

      {/* a few courses, only when the catalog has some (the home page's look: big centred heading,
          modern cards, a quiet link instead of a bordered button) */}
      {featured.length > 0 && (
        <section className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{s.coursesTitle}</h2>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">{s.coursesSub}</p>
          </div>
          {/* one course: a wide featured card; two or more: the grid */}
          {featured.length === 1 ? <CourseSpotlight item={featured[0]} hrefBase="/catalog" /> : <CatalogGrid items={featured} hrefBase="/catalog" centered />}
          <Link href="/catalog" className="group flex items-center gap-1 self-center text-base font-medium text-primary dark:text-success">
            <span className="group-hover:underline group-hover:underline-offset-4">{s.allCourses}</span>
            <Icon name="chevRight" className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </section>
      )}

      {/* closing invitation for everyone (students, teachers, schools), the twin of SchoolInvite */}
      <JoinInvite className="mt-4 sm:mt-8" />
    </div>
  )
}
