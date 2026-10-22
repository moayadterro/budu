import 'server-only'
import { showPrice } from '@/entities/course'
import { catalog, listedCourses } from '@/entities/course/server'
import type { Metadata } from 'next'
import { pageMetadata, snippet } from '@/shared/server/seo'
import { getT } from '@/shared/i18n/server'
import { NO_RATING } from '@/entities/review'
import { ratingsFor } from '@/entities/review/server'
import { getRates } from '@/shared/server/fx'
import { getLocale } from '@/shared/i18n/server'

/**
 * Everything listed in the marketplace (published), priced for this viewer's currency, with its
 * rating and teaching language. viewerId 0 = a visitor.
 */
export async function catalogFor(viewerId: number, currency: string) {
  const listings = await listedCourses()
  const ids = listings.map((l) => l.courseId)
  const [courses, rates, locale, ratings] = await Promise.all([catalog(ids, viewerId), getRates(), getLocale(), ratingsFor(ids)])
  const byId = new Map(listings.map((l) => [l.courseId, l]))
  return courses.map((course) => {
    const l = byId.get(course.id)!
    return { course, listing: l, price: showPrice(l.price, l.currency, currency, rates, locale), rating: ratings.get(course.id) ?? NO_RATING }
  })
}

/** SEO metadata of a marketplace course page (or its free preview); {} when it is not listed. */
export async function courseMetadata(rawId: string, preview = false): Promise<Metadata> {
  const id = Number(rawId)
  if (!Number.isSafeInteger(id) || id <= 0 || !(await listedCourses()).some((l) => l.courseId === id)) return {}
  const [[c], t] = await Promise.all([catalog([id]), getT()])
  if (!c) return {}
  return pageMetadata({
    path: preview ? `/catalog/${id}/preview` : `/catalog/${id}`,
    title: preview ? t.seo.coursePreview(c.title) : c.title,
    description: snippet(c.description || t.seo.catalog.description),
    image: c.imageId ? `/files/${c.imageId}` : null,
  })
}
