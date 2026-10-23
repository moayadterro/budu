import { LocalLink as Link } from '@/shared/ui/local-link'
import { CourseCover, type ShownPrice } from '@/entities/course'
import type { CatalogCourse } from '@/entities/course/server'
import { RatingLine, type Rating } from '@/entities/review'
import { languageName } from '@/shared/config/course-language'
import { isCourseSubject } from '@/shared/config/course-subject'
import { Badge } from '@/shared/ui/badge'
import { Icon } from '@/shared/ui/icon'
import { Rise } from '@/shared/ui/motion'
import { getLocale, getT } from '@/shared/i18n/server'

/**
 * One course, featured (the home page when the catalog has a single course; owner: one small centred
 * card looked lost): a wide horizontal card on desktop, the cover on one side and the course on the
 * other; stacked on phones. Same look as the course cards (no border, soft neutral shadow).
 */
export async function CourseSpotlight({
  item: { course: c, price: p, rating },
  hrefBase,
}: {
  item: { course: CatalogCourse; price: ShownPrice; rating: Rating }
  hrefBase: string
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()])
  return (
    <Rise className="mx-auto w-full max-w-5xl">
      <Link
        href={`${hrefBase}/${c.id}`}
        className="group grid overflow-hidden rounded-3xl bg-card shadow-[0_3px_8px_-2px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_16px_40px_-16px_color-mix(in_oklch,var(--foreground)_14%,transparent)] transition-all duration-300 hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:grid-cols-[1.1fr_1fr] dark:shadow-none dark:ring-1 dark:ring-foreground/8"
      >
        {/* phones: a 16:9 cover on top; desktop: the cover fills its side, the text decides the height */}
        <div className="relative overflow-hidden md:min-h-80">
          <CourseCover
            courseId={c.id}
            title={c.title}
            imageId={c.imageId}
            className="transition-transform duration-500 group-hover:scale-[1.03] md:absolute md:inset-0 md:aspect-auto md:h-full"
          />
        </div>
        <div className="flex flex-col gap-4 p-6 sm:p-10">
          {isCourseSubject(c.subject) && <p className="text-sm font-medium text-muted-foreground">{t.subjects[c.subject]}</p>}
          <h3 className="-mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{c.title}</h3>
          <RatingLine rating={rating} />
          {c.description && <p className="line-clamp-3 text-base leading-relaxed text-pretty text-muted-foreground">{c.description}</p>}
          <p className="truncate text-sm text-muted-foreground">{[c.teachers.map((x) => x.name).join(', '), c.school].filter(Boolean).join(' · ')}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {c.language && (
                <>
                  <Icon name="globe" className="size-4 flex-none" />
                  {languageName(c.language, locale)} ·{' '}
                </>
              )}
              {t.courses.lessonCount(c.lessons.length)}
            </span>
            {c.enrolled ? (
              <Badge variant="success">{t.shop.enrolled}</Badge>
            ) : p.free ? (
              <Badge variant="info">{t.shop.free}</Badge>
            ) : (
              <span className="text-2xl font-semibold tabular-nums">{p.shown}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-base font-medium text-primary dark:text-success">
            <span className="group-hover:underline group-hover:underline-offset-4">{t.landing.openCourse}</span>
            <Icon name="chevRight" className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Rise>
  )
}
