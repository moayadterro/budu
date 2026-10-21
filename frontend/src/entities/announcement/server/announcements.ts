import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance } from '@/shared/server/iomad'
import type { Announcement } from '../model/types'

/** School announcements in app-db (`announcements`). Callers check who may post / read. SERVER-SIDE ONLY. */

type Row = { id: string; company_id: number; school: string | null; author_name: string; title: string; body: string; created: number }

/** Newest announcements of these schools, at most `limit` per school (a busy school can't hide a quiet one). */
export async function listAnnouncements(companyIds: number[], limit = 10): Promise<Announcement[]> {
  if (!companyIds.length) return []
  const rows = await query<Row>(
    `SELECT id, company_id, school, author_name, title, body, created FROM (
       SELECT a.id, a.company_id, t.name AS school, a.author_name, a.title, a.body, a.created_at,
              extract(epoch FROM a.created_at)::int AS created,
              row_number() OVER (PARTITION BY a.company_id ORDER BY a.created_at DESC) AS n
         FROM announcements a
         LEFT JOIN tenants t ON t.iomad_url = a.iomad_url AND t.company_id = a.company_id
        WHERE a.iomad_url = $1 AND a.company_id = ANY($2::int[])
     ) x WHERE n <= $3 ORDER BY created_at DESC`,
    [defaultInstance().url, companyIds, limit],
  )
  return rows.map((r) => ({
    id: Number(r.id),
    companyId: r.company_id,
    school: r.school ?? '',
    authorName: r.author_name,
    title: r.title,
    body: r.body,
    createdAt: r.created,
  }))
}

export async function createAnnouncement(companyId: number, author: { id: number; name: string }, title: string, body: string) {
  await query(
    `INSERT INTO announcements (iomad_url, company_id, author_id, author_name, title, body) VALUES ($1, $2, $3, $4, $5, $6)`,
    [defaultInstance().url, companyId, author.id, author.name, title, body],
  )
}

export async function deleteAnnouncement(companyId: number, id: number) {
  await query(`DELETE FROM announcements WHERE id = $1 AND company_id = $2 AND iomad_url = $3`, [id, companyId, defaultInstance().url])
}
