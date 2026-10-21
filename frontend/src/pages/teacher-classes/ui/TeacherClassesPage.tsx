import Link from 'next/link'
import { myClasses } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Teacher: the classes they manage as a class teacher (optional — most teachers have none). */
export async function TeacherClassesPage() {
  const user = await requireRole('teacher')
  const t = await getT()
  const s = t.classes
  const { teaching } = await myClasses(user.userId)

  return (
    <>
      <ScreenHead title={s.myTitle} sub={s.mySub} />
      {teaching.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="layers" />
            </EmptyMedia>
            <EmptyDescription>{s.myEmpty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teaching.map((c) => (
            <Link
              key={c.id}
              href={`/teach/classes/${c.id}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors hover:bg-muted/50"
            >
              <span className="grid size-12 flex-none place-items-center rounded-lg bg-brand text-primary-foreground">
                <Icon name="layers" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">
                  {t.teach.studentCount(c.studentCount)} · {s.courseCount(c.courseCount)}
                </div>
              </div>
              <Icon name="chevRight" className="size-4 text-muted-foreground rtl:-scale-x-100" />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
