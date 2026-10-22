import { courseMetadata } from '@/widgets/course-catalog/server'
export { CatalogCoursePage as default } from '@/pages/catalog'
export const dynamic = 'force-dynamic'
export const generateMetadata = async ({ params }: { params: Promise<{ courseId: string }> }) => courseMetadata((await params).courseId)
