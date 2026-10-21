import Link from 'next/link'
import { showPrice } from '@/entities/course'
import { catalog, listedCourses } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { getCurrency } from '@/entities/user/server'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getRates } from '@/shared/server/fx'
import { getLocale, getT } from '@/shared/i18n/server'

/** Student: the marketplace — courses teachers listed, priced in the student's currency. */
export async function ExplorePage() {
  const user = await requireRole('student')
  const t = await getT()
  const s = t.shop
  const listings = await listedCourses()
  const [courses, rates, currency, locale] = await Promise.all([
    catalog(
      listings.map((l) => l.courseId),
      user.userId,
    ),
    getRates(),
    getCurrency(user.userId),
    getLocale(),
  ])
  const priceOf = new Map(listings.map((l) => [l.courseId, l]))

  return (
    <>
      <ScreenHead title={s.title} sub={s.sub} />
      {courses.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="store" />
            </EmptyMedia>
            <EmptyDescription>{s.empty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const l = priceOf.get(c.id)!
            const p = showPrice(l.price, l.currency, currency, rates, locale)
            return (
              <Link key={c.id} href={`/explore/${c.id}`} className="group rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardHeader className="flex items-start gap-3">
                    <span className="grid size-11 flex-none place-items-center rounded-lg bg-brand text-primary-foreground">
                      <Icon name="book" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="line-clamp-2">{c.title}</CardTitle>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {[c.teachers.map((x) => x.name).join(', '), c.school].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {c.description && <p className="line-clamp-3 text-sm text-muted-foreground">{c.description}</p>}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t.courses.lessonCount(c.lessons.length)}</span>
                    {c.enrolled ? (
                      <Badge variant="success">{s.enrolled}</Badge>
                    ) : p.free ? (
                      <Badge variant="info">{s.free}</Badge>
                    ) : (
                      <span className="text-sm font-semibold tabular-nums" title={p.original ?? undefined}>
                        {p.shown}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
