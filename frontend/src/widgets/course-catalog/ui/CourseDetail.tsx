import { LocalLink as Link } from '@/shared/ui/local-link'
import type { ReactNode } from 'react'
import { CourseCover, type ShownPrice } from '@/entities/course'
import type { CatalogCourse } from '@/entities/course/server'
import { CurrencyPicker } from '@/features/switch-currency'
import type { Currency } from '@/shared/config/currency'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { cn } from '@/shared/lib/cn'
import { Stars, type Rating } from '@/entities/review'
import { recentReviews } from '@/entities/review/server'
import { languageName } from '@/shared/config/course-language'
import { LocalTime } from '@/shared/ui/local-time'
import { getLocale, getT } from '@/shared/i18n/server'

/**
 * One marketplace course: cover, what's inside, who teaches it, the price — and `action` (Enrol /
 * Buy / Sign up). `previewHref`: lesson 1 opens as a free preview there and the rest show a lock
 * (people not in the course yet). `lockedHref`: where a locked lesson leads (visitors: sign in, then
 * back to this course).
 */
export async function CourseDetail({
  course,
  price,
  action,
  back,
  previewHref,
  lockedHref,
  currency,
  rating,
  language,
}: {
  course: CatalogCourse
  price: ShownPrice
  action: ReactNode
  back: { href: string; label: string }
  previewHref?: string | null
  lockedHref?: string | null
  /** the viewer's price currency — changeable right under the price */
  currency: Currency
  rating: Rating
  /** what the course is taught in; null = not said */
  language: string | null
}) {
  const [t, locale, reviews] = await Promise.all([getT(), getLocale(), recentReviews(course.id)])
  const s = t.shop
  const avg = rating.average.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ms-2 self-start" asChild>
        <Link href={back.href}>
          <Icon name="back" className="rtl:-scale-x-100" />
          {back.label}
        </Link>
      </Button>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <CourseCover courseId={course.id} title={course.title} imageId={course.imageId} className="rounded-xl" />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
            {course.school && <p className="text-sm text-muted-foreground">{course.school}</p>}
            {/* rating · reviews · students · language */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Stars value={rating.average} />
                <span className="font-semibold tabular-nums">{avg}</span>
                <span className="text-muted-foreground">{rating.count ? t.reviews.count(rating.count) : t.reviews.none}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Icon name="users" className="size-4" />
                {t.reviews.students(course.students)}
              </span>
              {language && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Icon name="globe" className="size-4" />
                  {t.reviews.taughtIn(languageName(language, locale))}
                </span>
              )}
            </div>
          </div>
          {course.description && (
            <Card>
              <CardHeader>
                <CardTitle>{s.about}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{course.description}</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{s.program}</CardTitle>
            </CardHeader>
            <CardContent>
              {course.lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.courses.noLessons}</p>
              ) : (
                <ol className="flex flex-col gap-1">
                  {course.lessons.map((l, i) =>
                    previewHref && i === 0 ? (
                      <li key={i}>
                        <Link
                          href={previewHref}
                          className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-primary/5"
                        >
                          <span className="grid size-7 flex-none place-items-center rounded-md bg-primary text-primary-foreground">
                            <Icon name="play" className="size-3.5 rtl:-scale-x-100" />
                          </span>
                          <span className="min-w-0 flex-1 font-medium">{l}</span>
                          <Badge variant="success">{t.preview.tag}</Badge>
                        </Link>
                      </li>
                    ) : previewHref && lockedHref ? (
                      <li key={i}>
                        <Link
                          href={lockedHref}
                          title={t.preview.signInToOpen}
                          className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <span className="grid size-7 flex-none place-items-center rounded-md bg-muted text-xs font-semibold tabular-nums">{i + 1}</span>
                          <span className="min-w-0 flex-1">{l}</span>
                          <Icon name="lock" className="size-4 flex-none" aria-label={t.preview.signInToOpen} />
                        </Link>
                      </li>
                    ) : (
                      <li key={i} className="flex items-center gap-3 py-1.5 text-sm">
                        <span className="grid size-7 flex-none place-items-center rounded-md bg-muted text-xs font-semibold tabular-nums">{i + 1}</span>
                        <span className={cn('min-w-0 flex-1', previewHref && 'text-muted-foreground')}>{l}</span>
                        {previewHref && <Icon name="lock" className="size-4 flex-none text-muted-foreground" aria-label={t.preview.locked} />}
                      </li>
                    ),
                  )}
                </ol>
              )}
            </CardContent>
          </Card>
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.reviews.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {reviews.map((rv, i) => (
                  <figure key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Stars value={rv.stars} />
                      <span className="font-medium">{rv.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        <LocalTime seconds={rv.at} />
                      </span>
                    </div>
                    <blockquote className="whitespace-pre-line text-sm text-muted-foreground">{rv.comment}</blockquote>
                  </figure>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div>
                <div className="text-xs text-muted-foreground">{s.price}</div>
                <div className="text-2xl font-semibold tabular-nums">{price.free ? s.free : price.shown}</div>
                {!price.free && (
                  <div className="mt-2">
                    <CurrencyPicker value={currency} inline />
                  </div>
                )}
              </div>
              {action}
            </CardContent>
          </Card>
          {course.teachers.length > 0 && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{s.teachers}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {course.teachers.map((x) => (
                  <div key={x.id} className="flex items-center gap-3">
                    <PersonAvatar person={x} />
                    <span className="text-sm font-medium">{x.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
