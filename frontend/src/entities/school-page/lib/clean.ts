import { PAGE_LIMITS as L, type BlockData, type BlockKind } from '../model/types'

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const id = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) && v > 0 ? v : null)
const arr = (v: unknown) => (Array.isArray(v) ? v : [])
const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 10))

/** Whatever the browser sent → a well-formed block of this kind (lengths and counts capped). */
export function cleanBlock<K extends BlockKind>(kind: K, raw: unknown): BlockData[K] {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: { [P in BlockKind]: () => BlockData[P] } = {
    text: () => ({ heading: str(r.heading, L.heading), body: str(r.body, L.text) }),
    photos: () => ({
      heading: str(r.heading, L.heading),
      items: arr(r.items)
        .map((p) => ({ fileId: id((p as Record<string, unknown>)?.fileId), caption: str((p as Record<string, unknown>)?.caption, L.note) }))
        .filter((p): p is { fileId: number; caption: string } => p.fileId !== null)
        .slice(0, L.photos),
    }),
    news: () => ({
      heading: str(r.heading, L.heading),
      items: arr(r.items)
        .map((n, i) => {
          const x = (n ?? {}) as Record<string, unknown>
          return { id: str(x.id, 40) || `n${Date.now()}${i}`, title: str(x.title, L.heading), body: str(x.body, L.text), date: date(x.date), fileId: id(x.fileId) }
        })
        .filter((n) => n.title || n.body)
        .slice(0, L.news),
    }),
    spotlight: () => ({ label: str(r.label, L.heading), name: str(r.name, L.name), text: str(r.text, L.text), fileId: id(r.fileId) }),
    top: () => ({
      heading: str(r.heading, L.heading),
      items: arr(r.items)
        .map((t) => ({ name: str((t as Record<string, unknown>)?.name, L.name), note: str((t as Record<string, unknown>)?.note, L.note) }))
        .filter((t) => t.name)
        .slice(0, L.top),
    }),
  }
  return out[kind]() as BlockData[K]
}
