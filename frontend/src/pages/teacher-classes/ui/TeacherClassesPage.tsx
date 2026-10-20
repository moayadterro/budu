import Link from 'next/link'
import { requireRole } from '@/entities/session/server'
import { teacherOverview } from '@/widgets/teacher-overview/server'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from '@/shared/ui/empty'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Teacher: courses as classes — students, homework, answers to grade. */
export async function TeacherClassesPage() {
  const user = await requireRole('teacher')
  const t = await getT()
  const s = t.teach
  const courses = await teacherOverview(user.userId, user.companyId)

  return (
    <>
      <ScreenHead title={s.classesTitle} sub={s.classesSub} />
      {courses.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyDescription>{s.noClasses}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/courses/new">{t.courses.newCourse}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card className="overflow-x-auto py-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{s.cols.course}</th>
                <th className="px-4 py-3 text-start font-medium">{s.cols.status}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.students}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.homework}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.toGrade}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 flex-none place-items-center rounded-md bg-brand text-xs font-semibold text-primary-foreground">
                        {c.title.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{t.courses.lessonCount(c.lessonCount)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.published ? 'success' : 'secondary'}>{c.published ? t.courses.published : t.courses.draft}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">{c.students}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{c.homework}</td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {c.toGrade > 0 ? (
                      <Link href={`/grading?course=${c.id}`} className="font-medium text-primary hover:underline">
                        {c.toGrade}
                      </Link>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/teach/classes/${c.id}`}>{s.open}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}
