/** Page addresses: 3–40 characters, a–z, 0–9 and dashes (not at the ends). */
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

/** Words a school can't take (they'd be confusing next to Budu's own pages). */
const RESERVED = new Set(['new', 'edit', 'admin', 'api', 'app', 'budu', 'school', 'schools', 'www', 'help', 'about', 'catalog', 'login', 'register', 'support', 'pricing', 'privacy', 'contact', 'settings', 'page', 'test'])

export const normalizeSlug = (s: string) => s.trim().toLowerCase()

export const slugValid = (s: string) => SLUG.test(s) && !RESERVED.has(s)
