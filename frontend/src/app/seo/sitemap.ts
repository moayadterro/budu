import type { MetadataRoute } from 'next'
import { catalog, listedCourses } from '@/entities/course/server'
import { publishedSchoolSlugs } from '@/entities/tenant/server'
import { DEFAULT_LOCALE, LANGUAGES, localePath } from '@/shared/i18n'

const PAGES = ['/', '/catalog', '/schools', '/pricing', '/about', '/help', '/contact', '/privacy', '/terms']

/**
 * /sitemap.xml — every public page in every language (English at /x, others at /<code>/x), each
 * entry naming its language versions (hreflang), so search engines find and pair them all:
 * the fixed pages, every published school page and every course listed in the marketplace.
 */
export async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? 'http://localhost:3000'
  const abs = (path: string) => new URL(path, base).toString()
  const entry = (path: string, lastModified?: Date) =>
    LANGUAGES.map((l) => ({
      url: abs(localePath(path, l.code)),
      lastModified,
      alternates: { languages: { ...Object.fromEntries(LANGUAGES.map((x) => [x.code, abs(localePath(path, x.code))])), 'x-default': abs(localePath(path, DEFAULT_LOCALE)) } },
    }))

  const [schools, listings] = await Promise.all([publishedSchoolSlugs().catch(() => []), listedCourses().catch(() => [])])
  const courses = await catalog(listings.map((l) => l.courseId)).catch(() => []) // only published ones come back
  return [
    ...PAGES.flatMap((p) => entry(p)),
    ...schools.flatMap((s) => entry(`/schools/${s.slug}`, s.updatedAt)),
    ...courses.flatMap((c) => [...entry(`/catalog/${c.id}`), ...entry(`/catalog/${c.id}/preview`)]),
  ]
}
