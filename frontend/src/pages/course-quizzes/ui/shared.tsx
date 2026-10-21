import 'server-only'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourse } from '@/entities/course/server'
import { listClasses } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { isSchool } from '@/entities/tenant/server'
import { CourseTabs } from '@/widgets/course-builder'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Teacher + a course they edit (404 otherwise). */
export async function courseForQuizzes(courseIdParam: string) {
  const user = await requireRole('teacher')
  const id = Number(courseIdParam)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const course = await getCourse(user.userId, id)
  if (!course?.canEdit) notFound()
  return { user, course }
}

/** The course's classes (school courses) — a quiz can be limited to some of them. */
export async function courseClasses(user: { userId: number; companyId: number | null }, courseId: number) {
  if (!user.companyId || !(await isSchool(user.companyId))) return []
  return (await listClasses(user.userId, user.companyId)).filter((c) => c.courseIds.includes(courseId)).map((c) => ({ id: c.id, name: c.name }))
}

/** Back link + course title + tabs, like the other course screens. */
export async function CourseQuizHeader({ course, back }: { course: { id: number; title: string; lessonCount: number }; back?: { href: string; label: string } }) {
  const t = await getT()
  return (
    <div>
      <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
        <Link href={back?.href ?? '/courses'}>
          <Icon name="back" className="rtl:-scale-x-100" />
          {back?.label ?? t.courses.back}
        </Link>
      </Button>
      <ScreenHead title={course.title} sub={t.courses.lessonCount(course.lessonCount)} />
      <CourseTabs courseId={course.id} />
    </div>
  )
}
