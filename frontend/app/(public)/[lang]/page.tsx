import { staticPageMetadata } from '@/shared/server/seo'
export { LandingPage as default } from '@/pages/landing'
export const dynamic = 'force-dynamic'
export const generateMetadata = staticPageMetadata('home', '/')
