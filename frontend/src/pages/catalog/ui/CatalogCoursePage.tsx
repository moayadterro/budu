import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { getCurrency, visitorCurrency } from '@/entities/user/server'
import { CourseDetail } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { Button } from '@/shared/ui/button'
import { getT } from '@/shared/i18n/server'

/** Public: one course. Visitors are asked to sign up (or sign in) to enrol; students go to Explore. */
export async function CatalogCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const user = await getSession()
  if (user?.role === 'student') redirect(`/explore/${id}`)
  const items = await catalogFor(user?.userId ?? 0, user ? await getCurrency(user.userId) : await visitorCurrency())
  const item = items.find((i) => i.course.id === id)
  if (!item) notFound()
  const t = await getT()
  const s = t.catalog
  return (
    <CourseDetail
      course={item.course}
      price={item.price}
      back={{ href: '/catalog', label: s.all }}
      action={
        user ? (
          <p className="text-sm text-muted-foreground">{s.studentsOnly}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/register">{item.price.free ? s.signUpFree : s.signUpBuy}</Link>
            </Button>
            <Button variant="ghost" asChild>
              {/* signing in comes back to this course, ready to enrol */}
              <Link href={`/login?next=${encodeURIComponent(`/explore/${id}`)}`}>{s.haveAccount}</Link>
            </Button>
          </div>
        )
      }
    />
  )
}
