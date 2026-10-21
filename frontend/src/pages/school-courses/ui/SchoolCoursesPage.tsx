import Link from 'next/link'
import { requireRole } from '@/entities/session/server'
import { schoolCourses } from '@/entities/tenant/server'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Empty, EmptyDescription, EmptyHeader } from '@/shared/ui/empty'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** School manager: all courses of the school with teachers, students and content counts. */
export async function SchoolCoursesPage() {
  const user = await requireRole('manager')
  const t = await getT()
  const s = t.school
  const courses = user.companyId ? await schoolCourses(user.userId, user.companyId) : []

  return (
    <>
      <ScreenHead title={s.coursesTitle} sub={s.coursesSub} />
      {courses.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyDescription>{s.noCourses}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="overflow-x-auto py-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{s.cols.course}</th>
                <th className="px-4 py-3 text-start font-medium">{s.cols.teachers}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.students}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.lessons}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.homework}</th>
                <th className="px-4 py-3 text-start font-medium">{s.cols.status}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.teachers || '—'}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{c.students}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{c.lessons}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{c.homework}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.published ? 'success' : 'secondary'}>{c.published ? t.courses.published : t.courses.draft}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/gradebook?course=${c.id}`}>{t.nav.gradebook}</Link>
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
