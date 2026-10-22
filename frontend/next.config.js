const { MAX_UPLOAD_MB } = { MAX_UPLOAD_MB: 250 } // keep in sync with src/shared/config/upload.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // don't announce the framework (X-Powered-By: Next.js) — nothing about our stack goes out
  poweredByHeader: false,
  experimental: {
    // Lesson uploads (videos) go through server actions and the proxy; leave room for form overhead.
    serverActions: { bodySizeLimit: `${MAX_UPLOAD_MB + 5}mb` },
    proxyClientMaxBodySize: `${MAX_UPLOAD_MB + 5}mb`,
  },
}
module.exports = nextConfig
