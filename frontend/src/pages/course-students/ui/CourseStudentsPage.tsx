import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourse, listStudents } from '@/entities/course/server'
import { listClasses } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { isSchool } from '@/entities/tenant/server'
import { EnrolClassForm, UnenrolClassButton } from '@/features/manage-classes'
import { EnrolStudentForm, RemoveStudentButton } from '@/features/manage-students'
import { CourseTabs } from '@/widgets/course-builder'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { Separator } from '@/shared/ui/separator'
import { getT } from '@/shared/i18n/server'

/** Teacher: a course's students — whole classes of their school, and individual students by email. */
export async function CourseStudentsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole('teacher')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const course = await getCourse(user.userId, id)
  if (!course?.canEdit) notFound()
  const t = await getT()
  const s = t.teach
  const c = t.classes
  const inSchool = await isSchool(user.companyId)
  const [students, classes] = await Promise.all([
    listStudents(user.userId, id),
    inSchool && user.companyId ? listClasses(user.userId, user.companyId) : Promise.resolve([]),
  ])
  const enrolled = classes.filter((k) => k.courseIds.includes(id))
  const options = classes.filter((k) => !k.courseIds.includes(id)).map((k) => ({ id: k.id, label: k.name }))

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
          <Link href="/courses">
            <Icon name="back" className="rtl:-scale-x-100" />
            {t.courses.back}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <ScreenHead title={course.title} sub={t.courses.lessonCount(course.lessonCount)} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/gradebook?course=${id}`}>{s.gradebookLink}</Link>
          </Button>
        </div>
        <CourseTabs courseId={id} />
      </div>

      {inSchool && (
        <Card>
          <CardHeader>
            <CardTitle>{c.inCourseTitle}</CardTitle>
            <CardDescription>{c.inCourseSub}</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {enrolled.length === 0 && <p className="text-sm text-muted-foreground">{c.noneInCourse}</p>}
            {enrolled.map((k) => (
              <Item key={k.id} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Icon name="layers" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{k.name}</ItemTitle>
                  <ItemDescription>{s.studentCount(k.studentCount)}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/gradebook?course=${id}&class=${k.id}`}>{c.gradebook}</Link>
                  </Button>
                  <UnenrolClassButton classId={k.id} courseId={id} />
                </ItemActions>
              </Item>
            ))}
            <EnrolClassForm courseId={id} options={options} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {s.studentsTitle} <span className="text-muted-foreground tabular-nums">({students.length})</span>
          </CardTitle>
          <CardDescription>{s.studentsSub}</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <EnrolStudentForm courseId={id} />
          <Separator />
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{s.noStudents}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {students.map((st) => (
                <Item key={st.id} size="sm" className="px-0">
                  <ItemMedia>
                    <PersonAvatar person={st} />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="truncate">{st.name}</ItemTitle>
                    <ItemDescription className="truncate">{st.email}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/messages/new?student=${st.id}`}>
                        <Icon name="chat" />
                        <span className="sr-only sm:not-sr-only">{t.messages.messageParents}</span>
                      </Link>
                    </Button>
                    <RemoveStudentButton courseId={id} studentId={st.id} />
                  </ItemActions>
                </Item>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
