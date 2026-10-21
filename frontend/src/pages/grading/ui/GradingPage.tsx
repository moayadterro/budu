import Link from 'next/link'
import { homeworkFileUrl, HomeworkStatusBadge, type SubmissionRow } from '@/entities/homework'
import { getSubmission, listSubmissions } from '@/entities/homework/server'
import { requireRole } from '@/entities/session/server'
import { GradeForm } from '@/features/grade-homework'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LinkSelect } from '@/shared/ui/link-select'
import { LocalTime } from '@/shared/ui/local-time'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { Separator } from '@/shared/ui/separator'
import { formatBytes } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { getGradeScale } from '@/entities/tenant/server'
import { getT } from '@/shared/i18n/server'

type Search = { course?: string; homework?: string; student?: string; view?: string }
const num = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : 0)

/** URL of the grading screen with these filters/selection (empty values dropped). */
function href(q: Record<string, string | number | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) if (v) p.set(k, String(v))
  const s = p.toString()
  return s ? `/grading?${s}` : '/grading'
}

/** Teacher: answers to grade (list) + the selected answer with grade & feedback. Live IOMAD data. */
export async function GradingPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireRole('teacher')
  const t = await getT()
  const scale = await getGradeScale(user.companyId)
  const s = t.grading
  const q = await searchParams
  const courseId = num(q.course)
  const homeworkId = num(q.homework)
  const view = q.view === 'graded' ? 'graded' : 'todo'

  const all = user.companyId ? await listSubmissions(user.userId, user.companyId, { courseId }) : []
  const homeworkOptions = [...new Map(all.map((x) => [x.homeworkId, x])).values()]
  const filtered = homeworkId ? all.filter((x) => x.homeworkId === homeworkId) : all
  const list = filtered.filter((x) => (view === 'graded' ? x.status === 'graded' : x.status === 'submitted'))
  const base = { course: courseId || undefined, homework: homeworkId || undefined }

  const studentId = num(q.student)
  const selectedRow: SubmissionRow | undefined =
    (studentId && homeworkId ? all.find((x) => x.homeworkId === homeworkId && x.student.id === studentId) : undefined) ?? list[0]
  const selected = selectedRow ? await getSubmission(user.userId, selectedRow.homeworkId, selectedRow.student.id) : null
  const todo = filtered.filter((x) => x.status === 'submitted')
  const next = todo.find((x) => !(x.homeworkId === selectedRow?.homeworkId && x.student.id === selectedRow?.student.id))
  const courses = [...new Map(all.map((x) => [x.courseId, x.courseTitle])).entries()]

  return (
    <>
      <ScreenHead title={s.title} sub={s.sub} />
      {all.length === 0 && !courseId ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="check" />
            </EmptyMedia>
            <EmptyDescription>{s.empty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card size="sm" className="lg:sticky lg:top-20">
            <CardContent className="gap-3">
              <div className="flex flex-col gap-2">
                {courses.length > 1 && (
                  <LinkSelect
                    className="w-full"
                    label={t.gradebook.course}
                    value={href({ course: courseId || undefined, view: view === 'graded' ? 'graded' : undefined })}
                    options={[
                      { href: href({ view: view === 'graded' ? 'graded' : undefined }), label: t.nav.courses },
                      ...courses.map(([id, title]) => ({ href: href({ course: id, view: view === 'graded' ? 'graded' : undefined }), label: title })),
                    ]}
                  />
                )}
                <LinkSelect
                  className="w-full"
                  label={s.allHomework}
                  value={href({ ...base, view: view === 'graded' ? 'graded' : undefined })}
                  options={[
                    { href: href({ course: courseId || undefined, view: view === 'graded' ? 'graded' : undefined }), label: s.allHomework },
                    ...homeworkOptions.map((h) => ({
                      href: href({ course: courseId || undefined, homework: h.homeworkId, view: view === 'graded' ? 'graded' : undefined }),
                      label: `${h.homeworkTitle} · ${h.courseTitle}`,
                    })),
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
                {(['todo', 'graded'] as const).map((v) => (
                  <Link
                    key={v}
                    href={href({ ...base, view: v === 'graded' ? 'graded' : undefined })}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-center font-medium transition-colors',
                      view === v ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {v === 'todo' ? s.toGrade : s.graded}{' '}
                    <span className="tabular-nums text-muted-foreground">
                      ({filtered.filter((x) => (v === 'graded' ? x.status === 'graded' : x.status === 'submitted')).length})
                    </span>
                  </Link>
                ))}
              </div>
              <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
                {list.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">{view === 'todo' ? t.teach.toGradeEmpty : s.empty}</p>}
                {list.map((x) => {
                  const active = selectedRow && x.homeworkId === selectedRow.homeworkId && x.student.id === selectedRow.student.id
                  return (
                    <Item
                      key={`${x.homeworkId}-${x.student.id}`}
                      size="sm"
                      className={cn('px-2', active && 'bg-muted')}
                      asChild
                    >
                      <Link href={href({ ...base, homework: x.homeworkId, student: x.student.id, view: view === 'graded' ? 'graded' : undefined })}>
                        <ItemMedia>
                          <PersonAvatar person={x.student} />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                          <ItemTitle className="truncate">{x.student.name}</ItemTitle>
                          <ItemDescription className="truncate">{x.homeworkTitle}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <HomeworkStatusBadge scale={scale} status={x.status} grade={x.grade} dueAt={x.dueAt} submittedAt={x.submittedAt} />
                        </ItemActions>
                      </Link>
                    </Item>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {selected ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <PersonAvatar person={selected.student} className="size-10 text-sm" />
                  <div className="min-w-0">
                    <CardTitle>{selected.student.name}</CardTitle>
                    <CardDescription>
                      {selected.homeworkTitle}
                      {selected.submittedAt && (
                        <>
                          {' '}· {s.handedIn} <LocalTime seconds={selected.submittedAt} />
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="ms-auto">
                    <HomeworkStatusBadge scale={scale}
                      status={selected.status}
                      grade={selected.grade}
                      dueAt={selected.dueAt}
                      submittedAt={selected.submittedAt}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="gap-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">{s.answer}</h3>
                  {selected.answer ? (
                    <p className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">{selected.answer}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{s.noAnswer}</p>
                  )}
                </div>
                {selected.files.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">{s.files}</h3>
                    {selected.files.map((f) => (
                      <Item key={f.id} variant="outline" size="sm" asChild>
                        <a href={homeworkFileUrl(f)} target="_blank" rel="noopener">
                          <ItemMedia variant="icon">
                            <Icon name="file" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{f.name}</ItemTitle>
                            <ItemDescription>{formatBytes(f.size)}</ItemDescription>
                          </ItemContent>
                          <Icon name="external" className="size-4 text-muted-foreground" />
                        </a>
                      </Item>
                    ))}
                  </div>
                )}
                <Separator />
                <GradeForm
                  homeworkId={selected.homeworkId}
                  studentId={selected.student.id}
                  grade={selected.grade}
                  feedback={selected.feedback}
                  nextHref={next ? href({ ...base, homework: next.homeworkId, student: next.student.id }) : null}
                  hereHref={href({ ...base, homework: selected.homeworkId, student: selected.student.id, view: 'graded' })}
                />
              </CardContent>
            </Card>
          ) : (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyDescription>{s.pick}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      )}
    </>
  )
}
