/** A school's public page (/schools/<slug>) — written by its managers, readable by anyone once published. */

export const BLOCK_KINDS = ['text', 'photos', 'news', 'spotlight', 'top'] as const
export type BlockKind = (typeof BLOCK_KINDS)[number]

export type Photo = { fileId: number; caption: string }
export type NewsItem = { id: string; title: string; body: string; date: string; fileId: number | null }
export type TopItem = { name: string; note: string }

/** What each block holds (stored as JSON). Free text only — rendered as text, never as HTML. */
export type BlockData = {
  text: { heading: string; body: string }
  photos: { heading: string; items: Photo[] }
  news: { heading: string; items: NewsItem[] }
  spotlight: { label: string; name: string; text: string; fileId: number | null }
  top: { heading: string; items: TopItem[] }
}

export type Block<K extends BlockKind = BlockKind> = { id: number; kind: K; data: BlockData[K] }

export type SchoolPage = {
  companyId: number
  name: string
  slug: string | null
  published: boolean
  tagline: string
  coverId: number | null
  city: string
  /** unix seconds — "on Budu since" */
  since: number
}

export const PAGE_LIMITS = { tagline: 160, heading: 120, text: 4000, name: 120, note: 200, photos: 6, news: 20, top: 3 } as const

export const emptyBlock = <K extends BlockKind>(kind: K): BlockData[K] =>
  (({
    text: { heading: '', body: '' },
    photos: { heading: '', items: [] },
    news: { heading: '', items: [] },
    spotlight: { label: '', name: '', text: '', fileId: null },
    top: { heading: '', items: [] },
  }) as BlockData)[kind]
