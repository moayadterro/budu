import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance, iomadCall, iomadUpload } from '@/shared/server/iomad'
import { cleanBlock } from '../lib/clean'
import { emptyBlock, type Block, type BlockKind, type SchoolPage } from '../model/types'

/**
 * School public pages in app-db (`tenants.slug`, `school_pages`, `school_page_blocks`). Callers check
 * the user manages the school before writing; reading a page by its address is public (published only,
 * unless the caller says the viewer may see the draft). SERVER-SIDE ONLY.
 */

const url = () => defaultInstance().url

type PageRow = { company_id: number; slug: string | null; since: number; published: boolean | null; tagline: string | null; cover_file: number | null }

const PAGE_SELECT = `SELECT t.company_id, t.slug, extract(epoch FROM t.created_at)::int AS since,
         p.published, p.tagline, p.cover_file
    FROM tenants t LEFT JOIN school_pages p ON p.iomad_url = t.iomad_url AND p.company_id = t.company_id
   WHERE t.iomad_url = $1 AND t.kind = 'school'`

/** name and city come from the IOMAD company (one source) */
async function toPage(r: PageRow): Promise<SchoolPage> {
  const [info] = await iomadCall<Array<{ id: number; name: string; city: string; logo: number }>>(defaultInstance(), 'local_budu_schools', { companyids: [r.company_id] })
  return {
    companyId: r.company_id,
    name: info?.name ?? '',
    slug: r.slug,
    city: info?.city ?? '',
    since: r.since,
    published: !!r.published,
    tagline: r.tagline ?? '',
    coverId: r.cover_file,
    logoId: info?.logo || null,
  }
}

/** The school's page settings (for its managers). null = not a registered school. */
export async function pageOf(companyId: number): Promise<SchoolPage | null> {
  const [row] = await query<PageRow>(`${PAGE_SELECT} AND t.company_id = $2`, [url(), companyId])
  return row ? await toPage(row) : null
}

/** A page by its address. Drafts only when `includeDraft` (the school's own managers). */
export async function pageBySlug(slug: string, includeDraft = false): Promise<SchoolPage | null> {
  const [row] = await query<PageRow>(`${PAGE_SELECT} AND lower(t.slug) = lower($2)`, [url(), slug])
  if (!row) return null
  const page = await toPage(row)
  return page.published || includeDraft ? page : null
}

/** Is this address free (or already this school's)? */
export async function slugFree(slug: string, companyId: number): Promise<boolean> {
  const [row] = await query<{ company_id: number }>(`SELECT company_id FROM tenants WHERE iomad_url = $1 AND lower(slug) = lower($2)`, [url(), slug])
  return !row || row.company_id === companyId
}

/** Address, published, tagline. false = the address was taken meanwhile. */
export async function savePage(companyId: number, p: { slug: string | null; published: boolean; tagline: string }): Promise<boolean> {
  try {
    await query(`UPDATE tenants SET slug = $3 WHERE iomad_url = $1 AND company_id = $2 AND kind = 'school'`, [url(), companyId, p.slug])
  } catch (e) {
    if ((e as { code?: string }).code === '23505') return false // unique: taken
    throw e
  }
  await query(
    `INSERT INTO school_pages (iomad_url, company_id, published, tagline) VALUES ($1, $2, $3, $4)
     ON CONFLICT (iomad_url, company_id) DO UPDATE SET published = EXCLUDED.published, tagline = EXCLUDED.tagline, updated_at = now()`,
    [url(), companyId, p.published && !!p.slug, p.tagline],
  )
  return true
}

/** Keep an uploaded image in IOMAD for the school's page (manager checked there too). Returns the file id. */
export async function savePhoto(userId: number, companyId: number, file: File): Promise<number> {
  const draft = await iomadUpload(defaultInstance(), file)
  const r = await iomadCall<{ id: number }>(defaultInstance(), 'local_budu_save_school_photo', { companyid: companyId, userid: userId, draftitemid: draft })
  return r.id
}

/** A member's profile picture copied onto the school's page (manager checked in IOMAD). null = they have none. */
export async function memberPhoto(userId: number, companyId: number, memberId: number): Promise<number | null> {
  const r = await iomadCall<{ id: number }>(defaultInstance(), 'local_budu_member_photo', { companyid: companyId, userid: userId, memberid: memberId })
  return r.id || null
}

export async function setCover(companyId: number, fileId: number | null) {
  await query(
    `INSERT INTO school_pages (iomad_url, company_id, cover_file) VALUES ($1, $2, $3)
     ON CONFLICT (iomad_url, company_id) DO UPDATE SET cover_file = EXCLUDED.cover_file, updated_at = now()`,
    [url(), companyId, fileId],
  )
}

type BlockRow = { id: string; kind: BlockKind; data: unknown }

/** The page's blocks, in order. */
export async function blocksOf(companyId: number): Promise<Block[]> {
  const rows = await query<BlockRow>(
    `SELECT id, kind, data FROM school_page_blocks WHERE iomad_url = $1 AND company_id = $2 ORDER BY position, id`,
    [url(), companyId],
  )
  return rows.map((r) => ({ id: Number(r.id), kind: r.kind, data: cleanBlock(r.kind, r.data) }))
}

/** A new, empty block at the end. Returns its id. */
export async function addBlock(companyId: number, kind: BlockKind): Promise<number> {
  const [row] = await query<{ id: string }>(
    `INSERT INTO school_page_blocks (iomad_url, company_id, kind, position, data)
     VALUES ($1, $2, $3, (SELECT coalesce(max(position), 0) + 1 FROM school_page_blocks WHERE iomad_url = $1 AND company_id = $2), $4)
     RETURNING id`,
    [url(), companyId, kind, JSON.stringify(emptyBlock(kind))],
  )
  return Number(row.id)
}

/** Save a block's content (cleaned for its kind). false = not this school's block. */
/**
 * Save a block. `prepare` may finish what the browser sent (e.g. the top students' photos), given
 * the block as it was stored before.
 */
export async function saveBlock(
  companyId: number,
  id: number,
  raw: unknown,
  prepare?: (block: Block, before: Block) => Promise<Block['data']>,
): Promise<boolean> {
  const [row] = await query<BlockRow>(`SELECT id, kind, data FROM school_page_blocks WHERE id = $1 AND iomad_url = $2 AND company_id = $3`, [id, url(), companyId])
  if (!row) return false
  const before = { id, kind: row.kind, data: cleanBlock(row.kind, row.data) }
  const block = { id, kind: row.kind, data: cleanBlock(row.kind, raw) }
  const data = prepare ? await prepare(block, before) : block.data
  await query(`UPDATE school_page_blocks SET data = $2, updated_at = now() WHERE id = $1`, [id, JSON.stringify(data)])
  return true
}

export async function deleteBlock(companyId: number, id: number) {
  await query(`DELETE FROM school_page_blocks WHERE id = $1 AND iomad_url = $2 AND company_id = $3`, [id, url(), companyId])
}

/** Swap a block with its neighbour above (-1) or below (1). */
export async function moveBlock(companyId: number, id: number, dir: -1 | 1) {
  const blocks = await query<{ id: string; position: number }>(
    `SELECT id, position FROM school_page_blocks WHERE iomad_url = $1 AND company_id = $2 ORDER BY position, id`,
    [url(), companyId],
  )
  const i = blocks.findIndex((b) => Number(b.id) === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= blocks.length) return
  // renumber everything so positions are distinct, then swap the two
  const order = blocks.map((b) => Number(b.id))
  ;[order[i], order[j]] = [order[j], order[i]]
  for (const [k, bid] of order.entries()) {
    await query(`UPDATE school_page_blocks SET position = $2 WHERE id = $1 AND iomad_url = $3 AND company_id = $4`, [bid, k + 1, url(), companyId])
  }
}
