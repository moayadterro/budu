import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGradebook } from '@/entities/homework/server'
import { getClass } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { getGradeScale, schoolCourses, schoolPeople } from '@/entities/tenant/server'
import {
  AddStudentsForm,
  ClassDetailsForm,
  ClassTeachersForm,
  EnrolClassForm,
  RemoveFromClassButton,
  UnenrolClassButton,
} from '@/features/manage-classes'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { Progress } from '@/shared/ui/progress'
import { ScreenHead } from '@/shared/ui/screen-head'
import { Separator } from '@/shared/ui/separator'
import { formatGrade, scaleMax } from '@/shared/lib/grade-scale'
import { getT } from '@/shared/i18n/server'

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/**
 * One class: students, class teachers and courses with the class's progress in each.
 * School managers can change it (/school/classes/:id); class teachers read it (/teach/classes/:id).
 */
export async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const user = await requireRole('manager', 'teacher')
  const id = Number((await params).classId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const cls = await getClass(user.userId, id)
  if (!cls) notFound()
  const t = await getT()
  const s = t.classes
  const scale = await getGradeScale(cls.companyId)

  // the class's progress per course: handed-in rate and average grade of ITS students only
  const progress = await Promise.all(
    cls.courses.map(async (c) => {
      const gb = await getGradebook(user.userId, c.id, cls.id)
      const cells = gb?.rows.flatMap((r) => r.cells) ?? []
      const grades = cells.filter((x) => x.grade !== null).map((x) => x.grade!)
      return {
        ...c,
        homework: gb?.homework.length ?? 0,
        handedIn: cells.length ? Math.round((cells.filter((x) => x.status !== 'new').length / cells.length) * 100) : null,
        average: avg(grades),
      }
    }),
  )

  // only managers get the editing data
  const [people, courses] = cls.canManage
    ? await Promise.all([schoolPeople(user.userId, cls.companyId), schoolCourses(user.userId, cls.companyId)])
    : [[], []]
  const inClass = new Set(cls.students.map((p) => p.id))
  // a student is in one class: students of another class are offered too, marked as a move
  const candidates = people
    .filter((p) => p.role === 'student' && !inClass.has(p.id))
    .map((p) => ({ ...p, note: p.className ? s.willMove(p.className) : undefined }))
  const teachers = people.filter((p) => p.role === 'teacher' || p.role === 'manager')
  const courseOptions = courses.filter((c) => !cls.courseIds.includes(c.id)).map((c) => ({ id: c.id, label: c.title }))
  const back = cls.canManage ? '/school/classes' : '/teach/classes'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
          <Link href={back}>
            <Icon name="back" className="rtl:-scale-x-100" />
            {cls.canManage ? s.back : s.myTitle}
          </Link>
        </Button>
        <ScreenHead
          title={cls.name}
          sub={[cls.description, t.teach.studentCount(cls.studentCount), cls.teachers.map((p) => p.name).join(', ')].filter(Boolean).join(' · ')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{s.coursesTitle}</CardTitle>
          <CardDescription>{s.coursesSub}</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          {cls.canManage && <EnrolClassForm classId={cls.id} options={courseOptions} />}
          {progress.length === 0 ? (
            <p className="text-sm text-muted-foreground">{s.noCourses}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pe-3 text-start font-medium">{t.school.cols.course}</th>
                    <th className="px-3 py-2 text-end font-medium">{s.homework}</th>
                    <th className="px-3 py-2 text-start font-medium">{s.handedIn}</th>
                    <th className="px-3 py-2 text-end font-medium">{s.average}</th>
                    <th className="py-2 ps-3" />
                  </tr>
                </thead>
                <tbody>
                  {progress.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 pe-3">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.teachers || '—'}</div>
                      </td>
                      <td className="px-3 py-3 text-end tabular-nums">{c.homework}</td>
                      <td className="px-3 py-3">
                        {c.handedIn === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Progress value={c.handedIn} className="h-1.5 w-24" />
                            <span className="text-xs tabular-nums text-muted-foreground">{c.handedIn}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-end font-semibold tabular-nums">
                        {c.average === null ? '—' : `${formatGrade(c.average, scale)} ${scaleMax(scale) ?? ''}`}
                      </td>
                      <td className="py-3 ps-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/gradebook?course=${c.id}&class=${cls.id}`}>{s.gradebook}</Link>
                          </Button>
                          {cls.canManage && <UnenrolClassButton classId={cls.id} courseId={c.id} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              {s.studentsTitle} <span className="text-muted-foreground tabular-nums">({cls.students.length})</span>
            </CardTitle>
            <CardDescription>{s.studentsSub}</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {cls.students.length === 0 && <p className="text-sm text-muted-foreground">{s.noStudents}</p>}
            <div className="flex flex-col gap-1">
              {cls.students.map((p) => (
                <Item key={p.id} size="sm" className="px-0">
                  <ItemMedia>
                    <PersonAvatar person={p} />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="truncate">{p.name}</ItemTitle>
                    <ItemDescription className="truncate">{p.email}</ItemDescription>
                  </ItemContent>
                  {cls.canManage && (
                    <ItemActions>
                      <RemoveFromClassButton classId={cls.id} studentId={p.id} />
                    </ItemActions>
                  )}
                </Item>
              ))}
            </div>
            {cls.canManage && (
              <>
                <Separator />
                <AddStudentsForm classId={cls.id} candidates={candidates} />
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{s.teachersTitle}</CardTitle>
              <CardDescription>{s.teachersSub}</CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              {cls.canManage ? (
                <ClassTeachersForm classId={cls.id} teachers={teachers} current={cls.teachers.map((p) => p.id)} />
              ) : cls.teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{s.noTeachers}</p>
              ) : (
                cls.teachers.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <PersonAvatar person={p} className="size-7" />
                    {p.name}
                    {p.id === user.userId && <Badge variant="secondary">{t.role.teacher}</Badge>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {cls.canManage && (
            <Card>
              <CardHeader>
                <CardTitle>{s.details}</CardTitle>
              </CardHeader>
              <CardContent>
                <ClassDetailsForm classId={cls.id} name={cls.name} description={cls.description} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
