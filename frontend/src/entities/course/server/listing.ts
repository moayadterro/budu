import 'server-only'
import { isCurrency, type Currency } from '@/shared/config/currency'
import { isCourseLanguage, type CourseLanguage } from '@/shared/config/course-language'
import { query } from '@/shared/server/db'
import { defaultInstance } from '@/shared/server/iomad'

/**
 * A course's marketplace listing in app-db (`course_listings`): shown in Explore or not, and its price
 * in the teacher's currency (0 = free). Callers check the user may edit the course. SERVER-SIDE ONLY.
 */
/** `language`: what the course is taught in (null = not said). */
export type Listing = { courseId: number; listed: boolean; price: number; currency: Currency; language: CourseLanguage | null }

type Row = { course_id: number; listed: boolean; price: string; currency: string; language: string | null }
const toListing = (r: Row): Listing => ({
  courseId: r.course_id,
  listed: r.listed,
  price: Number(r.price),
  currency: isCurrency(r.currency) ? r.currency : 'RUB',
  language: isCourseLanguage(r.language) ? r.language : null,
})

export async function getListing(courseId: number): Promise<Listing | null> {
  const [row] = await query<Row>(`SELECT course_id, listed, price, currency, language FROM course_listings WHERE iomad_url = $1 AND course_id = $2`, [
    defaultInstance().url,
    courseId,
  ])
  return row ? toListing(row) : null
}

/** Every course listed in Explore. */
export async function listedCourses(): Promise<Listing[]> {
  const rows = await query<Row>(`SELECT course_id, listed, price, currency, language FROM course_listings WHERE iomad_url = $1 AND listed`, [
    defaultInstance().url,
  ])
  return rows.map(toListing)
}

export async function saveListing(userId: number, l: Listing) {
  await query(
    `INSERT INTO course_listings (iomad_url, course_id, listed, price, currency, language, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (iomad_url, course_id) DO UPDATE
       SET listed = EXCLUDED.listed, price = EXCLUDED.price, currency = EXCLUDED.currency, language = EXCLUDED.language,
           updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [defaultInstance().url, l.courseId, l.listed, l.price, l.currency, l.language, userId],
  )
}
