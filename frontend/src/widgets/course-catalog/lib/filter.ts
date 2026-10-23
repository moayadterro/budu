/**
 * The catalog's search and filters, kept in the page address (?q=&subject=&lang=&price=&show=) so
 * a filtered view can be shared, bookmarked and indexed. Filtering runs on the server over every
 * listed course; the page shows `show` of them (24 more per "Show more").
 */
export const CATALOG_PAGE = 24

export type PriceFilter = '' | 'free' | 'paid'
export type CatalogQuery = { q: string; subject: string; lang: string; price: PriceFilter; show: number }

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? ''

export function readCatalogQuery(params: Params): CatalogQuery {
  const price = one(params.price)
  const show = Number(one(params.show))
  return {
    q: one(params.q).slice(0, 100),
    subject: one(params.subject).slice(0, 30),
    lang: one(params.lang).slice(0, 10),
    price: price === 'free' || price === 'paid' ? price : '',
    // whole pages only, and never more than a few thousand cards at once
    show: Number.isSafeInteger(show) && show > CATALOG_PAGE ? Math.min(Math.ceil(show / CATALOG_PAGE) * CATALOG_PAGE, 4800) : CATALOG_PAGE,
  }
}

export const isFiltered = (q: CatalogQuery) => Boolean(q.q || q.subject || q.lang || q.price)

/** Lower case, no accents, ё = е — so "Ёлка", "елка" and "Elka" find what they should. */
const fold = (s: string) =>
  s
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/ё/g, 'е')

type Item = {
  course: { title: string; school: string; teachers: Array<{ name: string }>; subject: string | null; language: string | null }
  price: { free: boolean }
}

/** The courses that match: every word of the search in the title, teacher or school; and each filter. */
export function filterCatalog<T extends Item>(items: T[], q: CatalogQuery): T[] {
  const words = fold(q.q).split(/\s+/).filter(Boolean)
  return items.filter(({ course: c, price }) => {
    if (q.subject && c.subject !== q.subject) return false
    if (q.lang && c.language !== q.lang) return false
    if (q.price === 'free' && !price.free) return false
    if (q.price === 'paid' && price.free) return false
    if (!words.length) return true
    const text = fold([c.title, c.school, ...c.teachers.map((t) => t.name)].join(' '))
    return words.every((w) => text.includes(w))
  })
}

/** What the filters can offer: only subjects and languages some listed course has, most courses first. */
export function catalogFacets(items: Item[]) {
  const count = (keys: Array<string | null>) => {
    const m = new Map<string, number>()
    for (const k of keys) if (k) m.set(k, (m.get(k) ?? 0) + 1)
    return [...m].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n }))
  }
  return {
    subjects: count(items.map((i) => i.course.subject)),
    languages: count(items.map((i) => i.course.language)),
    hasFree: items.some((i) => i.price.free),
    hasPaid: items.some((i) => !i.price.free),
  }
}
