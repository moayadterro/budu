import Link from 'next/link'
import { listTeacherCourses } from '@/entities/course/server'
import { getGradebook } from '@/entities/homework/server'
import { requireRole } from '@/entities/session/server'
import { StatTile } from '@/widgets/teacher-overview'
import { Card } from '@/shared/ui/card'
import { Empty, EmptyDescription, EmptyHeader } from '@/shared/ui/empty'
import { LinkSelect } from '@/shared/ui/link-select'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { cn } from '@/shared/lib/cn'
import { getT } from '@/shared/i18n/server'

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null)
/** Colour of a 0–100 grade (≥85 good, ≥60 ok, else low). */
const tone = (g: number) => (g >= 85 ? 'bg-success/10 text-success' : g >= 60 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive')

/** Teacher: students × homework grades of one course. Live IOMAD data (grades 0–100). */
export async function GradebookPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const user = await requireRole('teacher')
  const t = await getT()
  const s = t.gradebook
  const courses = user.companyId ? await listTeacherCourses(user.userId, user.companyId) : []
  const wanted = Number((await searchParams).course)
  const courseId = courses.find((c) => c.id === wanted)?.id ?? courses[0]?.id
  const gb = courseId ? await getGradebook(user.userId, courseId) : null

  const cells = gb?.rows.flatMap((r) => r.cells) ?? []
  const grades = cells.filter((c) => c.grade !== null).map((c) => c.grade!)
  const handedIn = cells.filter((c) => c.status !== 'new').length

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ScreenHead title={s.title} sub={s.sub} />
        {courses.length > 0 && (
          <LinkSelect
            className="w-full sm:w-72"
            label={s.course}
            value={`/gradebook?course=${courseId}`}
            options={courses.map((c) => ({ href: `/gradebook?course=${c.id}`, label: c.title }))}
          />
        )}
      </div>

      {!gb ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyDescription>{s.noCourses}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile icon="report" label={s.classAverage} value={avg(grades) ?? '—'} note={t.hw.outOf} />
            <StatTile icon="upload" label={s.handedIn} value={`${handedIn} / ${cells.length}`} note={t.teach.cols.homework} />
            <StatTile icon="check" label={s.gradedCount} value={grades.length} note={s.submittedNotGraded + `: ${handedIn - grades.length}`} />
          </div>

          {gb.rows.length === 0 || gb.homework.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyDescription>{gb.rows.length === 0 ? s.noStudents : s.noHomework}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card className="overflow-x-auto py-0">
              <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="sticky start-0 z-10 border-b bg-card px-4 py-3 text-start font-medium">{s.student}</th>
                    {gb.homework.map((h) => (
                      <th key={h.id} className="max-w-40 border-b px-3 py-3 text-center font-medium" title={h.title}>
                        <Link href={`/grading?course=${gb.courseId}&homework=${h.id}`} className="line-clamp-2 hover:text-foreground">
                          {h.title}
                        </Link>
                      </th>
                    ))}
                    <th className="border-b px-4 py-3 text-center font-medium">{s.average}</th>
                  </tr>
                </thead>
                <tbody>
                  {gb.rows.map((row) => {
                    const mine = row.cells.filter((c) => c.grade !== null).map((c) => c.grade!)
                    const a = avg(mine)
                    return (
                      <tr key={row.student.id}>
                        <td className="sticky start-0 z-10 border-b bg-card px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar person={row.student} className="size-7" />
                            <span className="truncate font-medium">{row.student.name}</span>
                          </div>
                        </td>
                        {row.cells.map((c) => (
                          <td key={c.homeworkId} className="border-b px-3 py-2.5 text-center tabular-nums">
                            {c.grade !== null ? (
                              <Link
                                href={`/grading?course=${gb.courseId}&homework=${c.homeworkId}&student=${row.student.id}&view=graded`}
                                className={cn('inline-block min-w-10 rounded-md px-2 py-0.5 font-medium', tone(c.grade))}
                              >
                                {c.grade}
                              </Link>
                            ) : c.status === 'submitted' ? (
                              <Link
                                href={`/grading?course=${gb.courseId}&homework=${c.homeworkId}&student=${row.student.id}`}
                                className="inline-block rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info"
                                title={s.submittedNotGraded}
                              >
                                {t.hw.status.submitted}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                        <td className="border-b px-4 py-2.5 text-center font-semibold tabular-nums">{a ?? '—'}</td>
                      </tr>
                    )
                  })}
                  <tr className="text-xs text-muted-foreground">
                    <td className="sticky start-0 z-10 bg-card px-4 py-3 font-medium">{s.classAverage}</td>
                    {gb.homework.map((h, i) => (
                      <td key={h.id} className="px-3 py-3 text-center tabular-nums">
                        {avg(gb.rows.map((r) => r.cells[i]?.grade).filter((g): g is number => g !== null && g !== undefined)) ?? '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-semibold tabular-nums">{avg(grades) ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </>
  )
}
