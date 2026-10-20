import { StudentCourseCard } from '@/entities/course'
import { myCourses } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Student: the courses they're enrolled in. Live IOMAD data. */
export async function ClassesPage() {
  const user = await requireRole('student')
  const t = await getT()
  const courses = await myCourses(user.userId)
  return (
    <>
      <ScreenHead title={t.learn.coursesTitle} sub={t.learn.coursesSub} />
      {courses.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="book" />
            </EmptyMedia>
            <EmptyDescription>{t.learn.empty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <StudentCourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </>
  )
}
