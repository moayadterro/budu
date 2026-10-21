import 'server-only'
import { showPrice } from '@/entities/course'
import { catalog, listedCourses } from '@/entities/course/server'
import { getRates } from '@/shared/server/fx'
import { getLocale } from '@/shared/i18n/server'

/** Everything listed in the marketplace (published), priced for this viewer's currency. viewerId 0 = a visitor. */
export async function catalogFor(viewerId: number, currency: string) {
  const listings = await listedCourses()
  const [courses, rates, locale] = await Promise.all([catalog(listings.map((l) => l.courseId), viewerId), getRates(), getLocale()])
  const byId = new Map(listings.map((l) => [l.courseId, l]))
  return courses.map((course) => {
    const l = byId.get(course.id)!
    return { course, listing: l, price: showPrice(l.price, l.currency, currency, rates, locale) }
  })
}
