import { notFound } from 'next/navigation'
import { openOrder } from '@/entities/order/server'
import { requireRole } from '@/entities/session/server'
import { getCurrency } from '@/entities/user/server'
import { BuyCourse } from '@/features/buy-course'
import { CourseDetail } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { getT } from '@/shared/i18n/server'

/** Student: one marketplace course — what's inside, who teaches it, its price, and Enrol / Buy. */
export async function ExploreCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole('student')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const [items, order] = await Promise.all([catalogFor(user.userId, await getCurrency(user.userId)), openOrder(user.userId, id)])
  const item = items.find((i) => i.course.id === id)
  if (!item) notFound()
  const t = await getT()
  const { course, listing, price } = item
  return (
    <CourseDetail
      course={course}
      price={price}
      back={{ href: '/explore', label: t.shop.back }}
      // not in the course yet: lesson 1 is a free preview, the rest are locked
      previewHref={course.enrolled ? null : `/catalog/${course.id}/preview`}
      action={
        <BuyCourse
          courseId={course.id}
          courseTitle={course.title}
          free={price.free}
          enrolled={course.enrolled}
          order={order && { id: order.id, number: order.number, amountRub: order.amountRub, status: order.status as 'pending' | 'reported' }}
          originalPrice={listing.currency === 'RUB' ? null : price.original}
        />
      }
    />
  )
}
