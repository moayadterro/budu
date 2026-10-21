import Link from 'next/link'
import { CourseRow } from '@/entities/course'
import { requireRole } from '@/entities/session/server'
import { teacherOverview, type CourseOverview } from '@/widgets/teacher-overview/server'
import { Badge } from '@/shared/ui/badge'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Teacher: the courses they publish (live IOMAD data). */
export async function TeacherCoursesPage() {
  const t = await getT()
  const user = await requireRole('teacher')
  const s = t.courses

  let courses: CourseOverview[] = []
  let failed = false
  try {
    courses = await teacherOverview(user.userId, user.companyId)
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
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/courses/${c.id}/students`}>{t.teach.studentCount(c.students)}</Link>
                </Button>
                {c.toGrade > 0 && (
                  <Link href={`/grading?course=${c.id}`}>
                    <Badge variant="info">
                      {t.teach.cols.toGrade}: {c.toGrade}
                    </Badge>
                  </Link>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/courses/${c.id}`}>{s.edit}</Link>
                </Button>
              </>
            }
          />
        ))}
      </div>
    </>
  )
}
