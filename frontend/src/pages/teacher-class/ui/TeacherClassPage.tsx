import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourse, listStudents } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { EnrolStudentForm, RemoveStudentButton } from '@/features/manage-students'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { Separator } from '@/shared/ui/separator'
import { getT } from '@/shared/i18n/server'

/** Teacher: one course's students — add by email, remove. */
export async function TeacherClassPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole('teacher')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const course = await getCourse(user.userId, id)
  if (!course?.canEdit) notFound()
  const students = await listStudents(user.userId, id)
  const t = await getT()
  const s = t.teach

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
          <Link href="/teach/classes">
            <Icon name="back" className="rtl:-scale-x-100" />
            {s.classesTitle}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <ScreenHead title={course.title} sub={t.courses.lessonCount(course.lessonCount)} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/gradebook?course=${id}`}>{s.gradebookLink}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${id}`}>{t.courses.edit}</Link>
            </Button>
          </div>
        </div>
        {!course.published && <Badge variant="secondary">{t.courses.draft} · {t.courses.draftHint}</Badge>}
      </div>

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
