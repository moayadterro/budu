/** Session cookie name (read by middleware too, so no server-only imports here). */
export const SESSION_COOKIE = 'budu_session'

/**
 * Pages reachable without signing in: auth pages, the public course catalog, and /files (it decides
 * itself: visitors only get published courses' covers).
 */
export const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/accept-invite', '/catalog', '/files', '/about', '/pricing', '/schools', '/help', '/contact', '/privacy', '/terms']
