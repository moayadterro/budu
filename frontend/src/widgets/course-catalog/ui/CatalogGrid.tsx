import { LocalLink as Link } from '@/shared/ui/local-link'
import { CourseCover, type ShownPrice } from '@/entities/course'
import type { CatalogCourse, Listing } from '@/entities/course/server'
import { RatingLine, type Rating } from '@/entities/review'
import { languageName } from '@/shared/config/course-language'
import { isCourseSubject } from '@/shared/config/course-subject'
import { Badge } from '@/shared/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { Rise } from '@/shared/ui/motion'
import { getLocale, getT } from '@/shared/i18n/server'

/** Course cards with covers, linking to `${hrefBase}/:id` (students: /explore; visitors: /catalog). */
export async function CatalogGrid({
  items,
  hrefBase,
  centered = false,
}: {
  items: Array<{ course: CatalogCourse; price: ShownPrice; rating: Rating; listing: Listing }>
  hrefBase: string
  /** the home page: cards centred under the centred heading, so a short last row (2 + 1 on a
   *  tablet, 1 or 2 courses) never hangs at the start */
  centered?: boolean
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()])
  const s = t.shop
  if (items.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name="store" />
          </EmptyMedia>
          <EmptyDescription>{s.empty}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return (
    <div
      className={
        centered
          ? 'flex flex-wrap justify-center gap-6 [&>*]:w-full sm:[&>*]:w-[calc(50%-0.75rem)] xl:[&>*]:w-[calc(33.333%-1rem)]'
          : 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'
      }
    >
      {items.map(({ course: c, price: p, rating }, i) => (
        <Rise key={c.id} index={i} className="flex">
        <Link
          href={`${hrefBase}/${c.id}`}
          // the home page's look (owner): no border, large radius, a soft NEUTRAL shadow (a hairline in
          // dark mode), a gentle lift on hover
          className="group flex w-full flex-col overflow-hidden rounded-3xl bg-card shadow-[0_3px_8px_-2px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_12px_28px_-12px_color-mix(in_oklch,var(--foreground)_10%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_12px_-4px_color-mix(in_oklch,var(--foreground)_10%,transparent),0_20px_40px_-16px_color-mix(in_oklch,var(--foreground)_16%,transparent)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:shadow-none dark:ring-1 dark:ring-foreground/8 dark:hover:shadow-none"
        >
          <div className="overflow-hidden">
            <CourseCover courseId={c.id} title={c.title} imageId={c.imageId} className="transition-transform duration-300 group-hover:scale-[1.03]" />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            {isCourseSubject(c.subject) && <p className="-mb-1 text-xs font-medium text-muted-foreground">{t.subjects[c.subject]}</p>}
            <h3 className="line-clamp-2 font-semibold leading-snug">{c.title}</h3>
            <RatingLine rating={rating} />
            <p className="truncate text-sm text-muted-foreground">{[c.teachers.map((x) => x.name).join(', '), c.school].filter(Boolean).join(' · ')}</p>
            {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
                {c.language && (
                  <>
                    <Icon name="globe" className="size-3.5 flex-none" />
                    {languageName(c.language, locale)} ·{' '}
                  </>
                )}
                {t.courses.lessonCount(c.lessons.length)}
              </span>
              {c.enrolled ? (
                <Badge variant="success">{s.enrolled}</Badge>
              ) : p.free ? (
                <Badge variant="info">{s.free}</Badge>
              ) : (
                <span className="font-semibold tabular-nums">
                  {p.shown}
                </span>
              )}
            </div>
          </div>
        </Link>
        </Rise>
      ))}
    </div>
  )
}
