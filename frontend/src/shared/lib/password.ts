/** Moodle's default password policy: 8+ chars, upper, lower, digit, symbol. */
export const passwordOk = (p: string) =>
  p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)

/** Only same-site paths, so ?next= can't send users to another site. */
export const safeNext = (next: unknown) =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null
