import type { MetadataRoute } from 'next'

/** /robots.txt — the public site is open to search engines; the signed-in app and its endpoints are not. */
export function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? 'http://localhost:3000'
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/events', '/uploads', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/accept-invite'] },
    sitemap: new URL('/sitemap.xml', base).toString(),
  }
}
