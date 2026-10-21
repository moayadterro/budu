import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourse } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { CourseBuilder, CourseTabs } from '@/widgets/course-builder'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Teacher: edit one course — details, publish, lessons, videos, PDFs, tasks. */
export async function CourseBuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const t = await getT()
  const user = await requireRole('teacher')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const course = await getCourse(user.userId, id)
  if (!course?.canEdit) notFound()

  const s = t.courses
  return (
    <>
      <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
        <Link href="/courses">
          <Icon name="back" className="rtl:-scale-x-100" />
          {s.back}
        </Link>
      </Button>
      <ScreenHead title={course.title} sub={s.lessonCount(course.lessonCount)} />
      <CourseTabs courseId={course.id} />
      <CourseBuilder course={course} authorName={user.name} />
    </>
  )
}
