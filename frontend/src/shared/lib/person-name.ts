/** Patronymic endings (Russian / Belarusian / Ukrainian / Central-Asian usage): -ович, -евич, -овна … */
const PATRONYMIC = /(ович|евич|ьич|ич|овна|евна|ична|инична)$/i

/**
 * One "full name" field → Moodle's first / middle / last name. Russian names may carry an отчество
 * in either common order, so the patronymic is recognised by its ending:
 *   "Иван Иванович Иванов" → Иван · Иванович · Иванов   (name, patronymic, surname)
 *   "Иванов Иван Иванович" → Иван · Иванович · Иванов   (surname first, formal order)
 *   "Moayad Al Terro"      → Moayad · — · Al Terro      (everything after the first word = surname)
 * null when there's only one word (IOMAD needs a last name).
 */
export function splitFullName(full: string): { first: string; middle: string; last: string } | null {
  const w = full.trim().split(/\s+/).filter(Boolean)
  if (w.length < 2) return null
  // the middle word is the patronymic → name first (also right for surnames like Шостакович)
  if (w.length === 3 && PATRONYMIC.test(w[1])) return { first: w[0], middle: w[1], last: w[2] }
  if (w.length === 3 && PATRONYMIC.test(w[2])) return { first: w[1], middle: w[2], last: w[0] }
  return { first: w[0], middle: '', last: w.slice(1).join(' ') }
}
