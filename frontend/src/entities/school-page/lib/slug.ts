/** Page addresses: 3–40 characters, a–z, 0–9 and dashes (not at the ends). */
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

/** Words a school can't take (they'd be confusing next to Budu's own pages). */
const RESERVED = new Set(['new', 'edit', 'admin', 'api', 'app', 'budu', 'school', 'schools', 'www', 'help', 'about', 'catalog', 'login', 'register', 'support', 'pricing', 'privacy', 'contact', 'settings', 'page', 'test'])

export const normalizeSlug = (s: string) => s.trim().toLowerCase()

export const slugValid = (s: string) => SLUG.test(s) && !RESERVED.has(s)

/** One of Budu's own words ("admin", "help" …) — a different message than a malformed one. */
export const slugReserved = (s: string) => RESERVED.has(s)

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya', і: 'i', ї: 'yi', є: 'ye', ґ: 'g', ў: 'u', қ: 'q', ғ: 'g', ң: 'n', ү: 'u', ұ: 'u', һ: 'h', ә: 'a', ө: 'o',
}

/**
 * An address from the school's name: "Лицей «Вектор» № 2" → "litsey-vektor-2", "Budu Test Academy" →
 * "budu-test-academy". Letters with no Latin spelling (Arabic …) are dropped; "" if nothing is left.
 */
export function slugFromName(name: string) {
  const latin = [...name.toLowerCase().replace(/№/g, ' ')].map((c) => CYRILLIC[c] ?? c).join('')
  const plain = latin.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  let slug = plain.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (slug.length > 40) slug = slug.slice(0, 40).replace(/-[^-]*$/, '') || slug.slice(0, 40)
  return slug.replace(/-+$/, '')
}
