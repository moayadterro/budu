import Link from 'next/link'
import { CourseRow, type CourseSummary } from '@/entities/course'
import { listTeacherCourses } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { t } from '@/shared/i18n'

/** Teacher: the courses they publish (live IOMAD data). */
export async function TeacherCoursesPage() {
  const user = await requireRole('teacher')
  const s = t.courses

  let courses: CourseSummary[] = []
  let failed = false
  try {
    courses = user.companyId ? await listTeacherCourses(user.userId, user.companyId) : []
  } catch (e) {
    console.error('list courses failed', e)
    failed = true
  }

  const newCourse = (
    <Button asChild>
      <Link href="/courses/new">
        <Icon name="plus" />
        {s.newCourse}
      </Link>
    </Button>
  )

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ScreenHead title={s.title} sub={s.sub} />
        {courses.length > 0 && newCourse}
      </div>
      {failed && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{s.loadError}</AlertDescription>
        </Alert>
      )}
      {!failed && courses.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="book" />
            </EmptyMedia>
            <EmptyTitle>{s.title}</EmptyTitle>
            <EmptyDescription>{s.empty}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newCourse}</EmptyContent>
        </Empty>
      )}
      <div className="flex flex-col gap-3">
        {courses.map((c) => (
          <CourseRow
            key={c.id}
            course={c}
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${c.id}`}>{s.edit}</Link>
              </Button>
            }
          />
        ))}
      </div>
    </>
  )
}
