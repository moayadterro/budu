/**
 * Budu's password policy (owner): 8+ characters with an upper-case letter, a lower-case letter and a
 * digit; symbols allowed, not required. IOMAD enforces the same (iomad/config.php: minpasswordnonalphanum = 0).
 */
export const passwordOk = (p: string) => p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p)

/** Only same-site paths, so ?next= can't send users to another site. */
export const safeNext = (next: unknown) =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null
