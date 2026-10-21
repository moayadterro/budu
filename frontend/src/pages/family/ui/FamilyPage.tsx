import Link from 'next/link'
import { AnnouncementsCard } from '@/entities/announcement'
import { listAnnouncements } from '@/entities/announcement/server'
import { progress } from '@/entities/family'
import { getFamily, requestsForParent } from '@/entities/family/server'
import { myHomework } from '@/entities/homework/server'
import { myWeek } from '@/entities/schedule/server'
import { myClasses } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { getGradeScale } from '@/entities/tenant/server'
import { ParentRequestCard } from '@/features/respond-to-invite'
import { SchoolEventsCard } from '@/widgets/week-calendar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { formatGrade } from '@/shared/lib/grade-scale'
import { cn } from '@/shared/lib/cn'
import { getT } from '@/shared/i18n/server'

/** Parent home: each child's last 7 days at a glance, their schools' announcements and events. */
export async function FamilyPage() {
  const user = await requireRole('parent')
  const t = await getT()
  const s = t.family
  const now = Math.floor(Date.now() / 1000)
  const [{ children }, requests] = await Promise.all([getFamily(user.userId), requestsForParent(user.userId)])
  const schoolIds = [...new Set(children.flatMap((c) => c.schools.map((x) => x.companyId)))]

  const [summaries, news, weeks] = await Promise.all([
    Promise.all(
      children.map(async (child) => {
        const [homework, classes, scale] = await Promise.all([
          myHomework(child.id),
          myClasses(child.id),
          getGradeScale(child.schools[0]?.companyId ?? null),
        ])
        const line = [child.schools[0]?.name, classes.member[0]?.name].filter(Boolean).join(' · ')
        return { child, line, scale, p: progress(homework, 'week', now) }
      }),
    ),
    listAnnouncements(schoolIds, 6),
    Promise.all(children.map((c) => myWeek(c.id, now - 86400, now + 14 * 86400))),
  ])
  // school events of all children's schools, once each
  const events = [...new Map(weeks.flat().filter((i) => i.kind === 'event').map((i) => [i.id, i])).values()].sort((a, b) => a.start - b.start)

  return (
    <>
      <ScreenHead title={s.homeTitle} sub={s.homeSub} />
      {requests.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {requests.map((r) => (
            <ParentRequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          {children.length === 0 && (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Icon name="users" />
                </EmptyMedia>
                <EmptyDescription>{s.noChildren}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {summaries.map(({ child, line, scale, p }) => (
            <Card key={child.id}>
              <CardHeader className="flex items-center gap-3">
                <PersonAvatar person={child} className="size-11" />
                <div className="min-w-0">
                  <CardTitle className="truncate">{child.name}</CardTitle>
                  {line && <CardDescription className="truncate">{line}</CardDescription>}
                </div>
                <CardAction>
                  <Button size="sm" asChild>
                    <Link href={`/family/${child.id}`}>{s.viewProgress}</Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="gap-4">
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground uppercase">{s.thisWeek}</div>
                  <dl className="grid grid-cols-3 gap-3">
                    <Stat label={s.stats.handedIn} value={String(p.handedIn.length)} />
                    <Stat label={s.stats.overdue} value={String(p.overdue.length)} tone={p.overdue.length ? 'bad' : undefined} />
                    <Stat label={s.stats.average} value={p.periodAverage === null ? '—' : formatGrade(p.periodAverage, scale)} />
                  </dl>
                </div>
                {p.courses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.courses.map((c) => (
                      <Badge key={c.courseId} variant="secondary" className="font-normal">
                        {c.courseTitle}
                        {c.average !== null && <span className="ms-1 font-semibold tabular-nums">{formatGrade(c.average, scale)}</span>}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <AnnouncementsCard items={news} showSchool={schoolIds.length > 1} showEmpty={schoolIds.length > 0} />
          <SchoolEventsCard items={events} />
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-xl font-semibold tabular-nums', tone === 'bad' && 'text-destructive')}>{value}</dd>
    </div>
  )
}
