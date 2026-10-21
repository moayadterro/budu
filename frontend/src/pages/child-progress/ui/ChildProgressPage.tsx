import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PERIODS, progress, type Period } from '@/entities/family'
import { childCourses, childOf } from '@/entities/family/server'
import { myHomework } from '@/entities/homework/server'
import { myClasses } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { getGradeScale } from '@/entities/tenant/server'
import { StartConversationButton } from '@/features/chat'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { formatGrade, gradeTone } from '@/shared/lib/grade-scale'
import { cn } from '@/shared/lib/cn'
import { getT } from '@/shared/i18n/server'

const toneClass = { good: 'text-success', ok: 'text-warning', low: 'text-destructive' } as const

/** Parent: how one child is doing — last 24 h / 7 days / 30 days, overdue work, feedback, courses + teachers. */
export async function ChildProgressPage(props: { params: Promise<{ childId: string }>; searchParams: Promise<{ period?: string }> }) {
  const user = await requireRole('parent')
  const childId = Number((await props.params).childId)
  if (!Number.isSafeInteger(childId) || childId <= 0) notFound()
  const child = await childOf(user.userId, childId)
  if (!child) notFound()
  const asked = (await props.searchParams).period
  const period: Period = PERIODS.includes(asked as Period) ? (asked as Period) : 'week'
  const t = await getT()
  const s = t.family
  const now = Math.floor(Date.now() / 1000)
  const [homework, courses, classes, scale] = await Promise.all([
    myHomework(childId),
    childCourses(childId),
    myClasses(childId),
    getGradeScale(child.schools[0]?.companyId ?? null),
  ])
  const p = progress(homework, period, now)
  const line = [child.schools[0]?.name, classes.member[0]?.name].filter(Boolean).join(' · ')
  const grade = (g: number) => <span className={cn('font-semibold tabular-nums', toneClass[gradeTone(g)])}>{formatGrade(g, scale)}</span>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
          <Link href="/family">
            <Icon name="back" className="rtl:-scale-x-100" />
            {s.back}
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <PersonAvatar person={child} className="size-12" />
          <ScreenHead title={child.name} sub={line || undefined} />
        </div>
      </div>

      <nav className="inline-flex w-fit rounded-lg bg-muted p-1" aria-label={s.thisWeek}>
        {PERIODS.map((k) => (
          <Link
            key={k}
            href={`/family/${childId}?period=${k}`}
            aria-current={k === period ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors',
              k === period ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
            )}
          >
            {s.periods[k]}
          </Link>
        ))}
      </nav>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={s.stats.handedIn} value={String(p.handedIn.length)} />
        <Stat label={s.stats.late} value={String(p.late.length)} tone={p.late.length ? 'warn' : undefined} />
        <Stat label={s.stats.overdue} value={String(p.overdue.length)} tone={p.overdue.length ? 'bad' : undefined} />
        <Stat label={s.stats.average} value={p.periodAverage === null ? '—' : formatGrade(p.periodAverage, scale)} />
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{s.feedbackTitle}</CardTitle>
              <CardDescription>{s.periods[period]}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {p.graded.length === 0 && <p className="text-sm text-muted-foreground">{s.noFeedback}</p>}
              {p.graded.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{h.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {h.courseTitle} · <LocalTime seconds={h.gradedAt!} />
                      {h.dueAt && h.submittedAt && h.submittedAt > h.dueAt && (
                        <Badge variant="warning" className="ms-2">
                          {s.late}
                        </Badge>
                      )}
                    </div>
                    {h.feedback && <p className="mt-1 border-s-2 ps-3 text-sm whitespace-pre-line text-muted-foreground">{h.feedback}</p>}
                  </div>
                  {grade(h.grade!)}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{s.overdueTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {p.overdue.length === 0 && <p className="text-sm text-muted-foreground">{s.noOverdue}</p>}
              {p.overdue.map((h) => (
                <Item key={h.id} size="sm" className="px-0">
                  <ItemMedia variant="icon" className="bg-destructive/10 text-destructive">
                    <Icon name="alert" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="truncate">{h.title}</ItemTitle>
                    <ItemDescription className="truncate">
                      {h.courseTitle} · {s.wasDue} <LocalTime seconds={h.dueAt!} />
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{s.coursesTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {courses.length === 0 && <p className="text-sm text-muted-foreground">{s.noCourses}</p>}
            {courses.map((c) => {
              const cp = p.courses.find((x) => x.courseId === c.courseId)
              return (
                <section key={c.courseId} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="min-w-0 truncate text-sm font-medium">{c.courseTitle}</h3>
                    <span className="text-sm text-muted-foreground">
                      {s.average}: {cp?.average != null ? grade(cp.average) : '—'}
                    </span>
                  </div>
                  {cp && <p className="text-xs text-muted-foreground">{s.homeworkDone(cp.done, cp.total)}</p>}
                  {c.teachers.map((teacher) => (
                    <Item key={teacher.id} size="sm" variant="outline">
                      <ItemMedia>
                        <PersonAvatar person={teacher} />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="truncate">{teacher.name}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <StartConversationButton childId={childId} withId={teacher.id} />
                      </ItemActions>
                    </Item>
                  ))}
                </section>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bad' | 'warn' }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-2xl font-semibold tabular-nums', tone === 'bad' && 'text-destructive', tone === 'warn' && 'text-warning')}>{value}</dd>
    </div>
  )
}
