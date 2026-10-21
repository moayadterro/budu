import Link from 'next/link'
import { CourseCover, type ShownPrice } from '@/entities/course'
import type { CatalogCourse, Listing } from '@/entities/course/server'
import { RatingLine, type Rating } from '@/entities/review'
import { languageName } from '@/shared/config/course-language'
import { Badge } from '@/shared/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { getLocale, getT } from '@/shared/i18n/server'

/** Course cards with covers, linking to `${hrefBase}/:id` (students: /explore; visitors: /catalog). */
export async function CatalogGrid({
  items,
  hrefBase,
}: {
  items: Array<{ course: CatalogCourse; price: ShownPrice; rating: Rating; listing: Listing }>
  hrefBase: string
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
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ course: c, price: p, rating, listing }) => (
        <Link
          key={c.id}
          href={`${hrefBase}/${c.id}`}
          className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <div className="overflow-hidden">
            <CourseCover courseId={c.id} title={c.title} imageId={c.imageId} className="transition-transform duration-300 group-hover:scale-[1.03]" />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <h3 className="line-clamp-2 font-semibold leading-snug">{c.title}</h3>
            <RatingLine rating={rating} />
            <p className="truncate text-sm text-muted-foreground">{[c.teachers.map((x) => x.name).join(', '), c.school].filter(Boolean).join(' · ')}</p>
            {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
                {listing.language && (
                  <>
                    <Icon name="globe" className="size-3.5 flex-none" />
                    {languageName(listing.language, locale)} ·{' '}
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
      ))}
    </div>
  )
}
