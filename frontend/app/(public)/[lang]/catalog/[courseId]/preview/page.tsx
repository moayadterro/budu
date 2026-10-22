import { courseMetadata } from '@/widgets/course-catalog/server'
export { CoursePreviewPage as default } from '@/pages/course-preview'
export const dynamic = 'force-dynamic'
export const generateMetadata = async ({ params }: { params: Promise<{ courseId: string }> }) => courseMetadata((await params).courseId, true)
