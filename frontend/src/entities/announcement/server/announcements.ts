import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance } from '@/shared/server/iomad'
import type { Announcement, AnnouncementScope, Audience } from '../model/types'

/** Announcements in app-db (`announcements`). Callers check who may post / read. SERVER-SIDE ONLY. */

type Row = {
  id: string
  company_id: number
  school: string | null
  audience: Audience
  target_id: number | null
  target_name: string
  author_id: number
  author_name: string
  title: string
  body: string
  created: number
}

const toAnnouncement = (r: Row): Announcement => ({
  id: Number(r.id),
  companyId: r.company_id,
  school: r.school ?? '',
  audience: r.audience,
  targetId: r.target_id,
  targetName: r.target_name,
  authorId: r.author_id,
  authorName: r.author_name,
  title: r.title,
  body: r.body,
  createdAt: r.created,
})

const COLUMNS = `a.id, a.company_id, t.name AS school, a.audience, a.target_id, a.target_name, a.author_id, a.author_name,
  a.title, a.body, extract(epoch FROM a.created_at)::int AS created`

/**
 * Newest announcements the scope allows, at most `limit` per school (a busy school can't hide a
 * quiet one), newest first.
 */
export async function listAnnouncements(scope: AnnouncementScope, limit = 10): Promise<Announcement[]> {
  const { schools = [], classes = [], courses = [], allOf = [] } = scope
  if (!schools.length && !classes.length && !courses.length && !allOf.length) return []
  const rows = await query<Row>(
    `SELECT * FROM (
       SELECT ${COLUMNS}, a.created_at,
              row_number() OVER (PARTITION BY a.company_id ORDER BY a.created_at DESC) AS n
         FROM announcements a
         LEFT JOIN tenants t ON t.iomad_url = a.iomad_url AND t.company_id = a.company_id
        WHERE a.iomad_url = $1 AND (
              (a.audience = 'school' AND a.company_id = ANY($2::int[]))
           OR (a.audience = 'class'  AND a.target_id  = ANY($3::int[]))
           OR (a.audience = 'course' AND a.target_id  = ANY($4::int[]))
           OR a.company_id = ANY($5::int[]))
     ) x WHERE n <= $6 ORDER BY created_at DESC`,
    [defaultInstance().url, schools, classes, courses, allOf, limit],
  )
  return rows.map(toAnnouncement)
}

export async function getAnnouncement(id: number): Promise<Announcement | null> {
  const [row] = await query<Row>(
    `SELECT ${COLUMNS} FROM announcements a
       LEFT JOIN tenants t ON t.iomad_url = a.iomad_url AND t.company_id = a.company_id
      WHERE a.id = $1 AND a.iomad_url = $2`,
    [id, defaultInstance().url],
  )
  return row ? toAnnouncement(row) : null
}

export async function createAnnouncement(p: {
  companyId: number
  author: { id: number; name: string }
  audience: Audience
  target: { id: number; name: string } | null
  title: string
  body: string
}) {
  await query(
    `INSERT INTO announcements (iomad_url, company_id, author_id, author_name, audience, target_id, target_name, title, body)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [defaultInstance().url, p.companyId, p.author.id, p.author.name, p.audience, p.target?.id ?? null, p.target?.name ?? '', p.title, p.body],
  )
}

export async function deleteAnnouncement(id: number) {
  await query(`DELETE FROM announcements WHERE id = $1 AND iomad_url = $2`, [id, defaultInstance().url])
}
