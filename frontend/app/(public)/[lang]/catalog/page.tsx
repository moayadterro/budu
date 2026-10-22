import { staticPageMetadata } from '@/shared/server/seo'
export { CatalogPage as default } from '@/pages/catalog'
export const dynamic = 'force-dynamic'
export const generateMetadata = staticPageMetadata('catalog', '/catalog')
