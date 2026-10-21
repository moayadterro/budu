import Link from 'next/link'
import { listClasses } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { CreateClassForm } from '@/features/manage-classes'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Empty, EmptyDescription, EmptyHeader } from '@/shared/ui/empty'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** School manager: the school's classes (e.g. Class 1 … Class 11) + create one. */
export async function SchoolClassesPage() {
  const user = await requireRole('manager')
  const t = await getT()
  const s = t.classes
  const classes = user.companyId ? await listClasses(user.userId, user.companyId) : []

  return (
    <div className="flex flex-col gap-6">
      <ScreenHead title={s.title} sub={s.sub} />
      <Card>
        <CardHeader>
          <CardTitle>{s.create}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateClassForm />
        </CardContent>
      </Card>
      {classes.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyDescription>{s.empty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="overflow-x-auto py-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{s.cols.class}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.students}</th>
                <th className="px-4 py-3 text-end font-medium">{s.cols.courses}</th>
                <th className="px-4 py-3 text-start font-medium">{s.cols.teachers}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">{c.studentCount}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{c.courseCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.teachers.map((p) => p.name).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/school/classes/${c.id}`}>{s.open}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
