import Link from 'next/link'
import { notFound } from 'next/navigation'
import { showPrice } from '@/entities/course'
import { catalog, getListing } from '@/entities/course/server'
import { openOrder } from '@/entities/order/server'
import { requireRole } from '@/entities/session/server'
import { getCurrency } from '@/entities/user/server'
import { BuyCourse } from '@/features/buy-course'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { getRates } from '@/shared/server/fx'
import { getLocale, getT } from '@/shared/i18n/server'

/** Student: one marketplace course — what's inside, who teaches it, its price, and Enrol / Buy. */
export async function ExploreCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole('student')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const listing = await getListing(id)
  if (!listing?.listed) notFound()
  const [[course], rates, currency, locale, order] = await Promise.all([
    catalog([id], user.userId),
    getRates(),
    getCurrency(user.userId),
    getLocale(),
    openOrder(user.userId, id),
  ])
  if (!course) notFound()
  const t = await getT()
  const s = t.shop
  const p = showPrice(listing.price, listing.currency, currency, rates, locale)

  return (
    <>
      <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
        <Link href="/explore">
          <Icon name="back" className="rtl:-scale-x-100" />
          {s.back}
        </Link>
      </Button>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-start gap-4">
            <span className="grid size-14 flex-none place-items-center rounded-xl bg-brand text-primary-foreground">
              <Icon name="book" className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
              {course.school && <p className="text-sm text-muted-foreground">{course.school}</p>}
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
                <ol className="flex flex-col gap-2">
                  {course.lessons.map((l, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="grid size-7 flex-none place-items-center rounded-md bg-muted text-xs font-semibold tabular-nums">{i + 1}</span>
                      {l}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div>
                <div className="text-xs text-muted-foreground">{s.price}</div>
                <div className="text-2xl font-semibold tabular-nums">{p.free ? s.free : p.shown}</div>
                {p.original && <div className="text-xs text-muted-foreground">{s.teacherPrice(p.original)}</div>}
              </div>
              <BuyCourse
                courseId={course.id}
                courseTitle={course.title}
                free={p.free}
                enrolled={course.enrolled}
                order={order && { id: order.id, number: order.number, amountRub: order.amountRub, status: order.status as 'pending' | 'reported' }}
                originalPrice={listing.currency === 'RUB' ? null : p.original ?? null}
              />
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
    </>
  )
}
