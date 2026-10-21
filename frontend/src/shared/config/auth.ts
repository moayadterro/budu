/** Session cookie name (read by middleware too, so no server-only imports here). */
export const SESSION_COOKIE = 'budu_session'

/** Pages reachable without signing in. */
export const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/accept-invite']
