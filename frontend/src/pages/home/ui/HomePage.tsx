import Link from 'next/link'
import { ScreenHead } from '@/shared/ui/screen-head'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { Icon, PlayIcon } from '@/shared/ui/icon'
import { requireRole } from '@/entities/session/server'
import { StudentCourseCard } from '@/entities/course'
import { myCourses } from '@/entities/course/server'
import { HomeworkStatusBadge } from '@/entities/homework'
import { myHomework } from '@/entities/homework/server'
import { myClasses } from '@/entities/school-class/server'
import { STUDENT, SUBJECTS, TIMES, TODAY, WEEK, isLive } from '@/shared/mock'
import { LocalTime } from '@/shared/ui/local-time'
import { cn } from '@/shared/lib/cn'
import { getGradeScale } from '@/entities/tenant/server'
import { getLocale, getT } from '@/shared/i18n/server'

/** Student dashboard. */
export async function HomePage() {
  const t = await getT()
  const user = await requireRole('student')
  const scale = await getGradeScale(user.companyId)
  const firstName = user.name.split(' ')[0] ?? ''
  const [courses, homework, classes, locale] = await Promise.all([
    myCourses(user.userId),
    myHomework(user.userId),
    myClasses(user.userId),
    getLocale(),
  ])
  const today = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  // their class (at most one per school); a solo student or one without a class: no line at all
  const classLine = classes.member[0]?.name
  // what's still to hand in, soonest due first (no due date last)
  const due = homework
    .filter((h) => h.status === 'new')
    .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))
    .slice(0, 5)
  return (
    <>
      <ScreenHead eyebrow={today} title={t.home.hi(firstName)} sub={classLine} />

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <NextClass />
          <Card>
            <CardHeader>
              <CardTitle>{t.home.today}</CardTitle>
              <CardAction>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link href="/timetable">{t.home.fullWeek}</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <TodayStrip />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.learn.coursesTitle}</CardTitle>
              <CardAction>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link href="/classes">{t.viewAll}</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {courses.length === 0 && <p className="text-sm text-muted-foreground">{t.learn.empty}</p>}
              {courses.slice(0, 4).map((c) => (
                <StudentCourseCard key={c.id} course={c} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.home.hwTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {due.length === 0 && <p className="text-sm text-muted-foreground">{t.learn.allDone}</p>}
              {due.map((hw) => (
                <Item key={hw.id} size="sm" asChild className="px-2">
                  <Link href={`/classes/${hw.courseId}/homework/${hw.id}`}>
                    <ItemMedia variant="icon" className="bg-warning/10 text-warning">
                      <Icon name="task" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{hw.title}</ItemTitle>
                      <ItemDescription className="truncate">
                        {hw.courseTitle}
                        {hw.dueAt && (
                          <>
                            {' '}· {t.hw.due} <LocalTime seconds={hw.dueAt} />
                          </>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <HomeworkStatusBadge scale={scale} status={hw.status} grade={hw.grade} dueAt={hw.dueAt} submittedAt={hw.submittedAt} />
                  </Link>
                </Item>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.home.annTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.home.ann}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

async function NextClass() {
  const t = await getT()
  return (
    <div className="overflow-hidden rounded-xl bg-brand p-6 text-primary-foreground shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold opacity-90">
        <span className="dot-live bg-primary-foreground text-primary-foreground" />
        {t.home.yourNext}
      </div>
      <h3 className="mt-2.5 text-xl font-bold">{t.home.nextSubject}</h3>
      <div className="mt-[3px] text-[13px] opacity-85">
        {t.withTeacher} {SUBJECTS.math.teacher} · {t.room} {STUDENT.className}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/live" className={buttonVariants({ variant: 'highlight' })}>
          <PlayIcon />
          {t.joinNow}
        </Link>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary-foreground/15 px-3 text-sm font-semibold tabular-nums">
          ⏱ 12:00
        </span>
        <span className="text-xs opacity-85">{t.home.startsAt}</span>
      </div>
      <div className="mt-3.5 flex items-center gap-2 border-t border-primary-foreground/20 pt-3 text-xs opacity-85">
        <Icon name="chevRight" className="h-3.5 w-3.5" strokeWidth={2} />
        {t.home.then}
      </div>
    </div>
  )
}

async function TodayStrip() {
  const t = await getT()
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {TIMES.map((time, row) => {
        const key = WEEK[row][TODAY]
        if (!key) return null
        const s = SUBJECTS[key]
        const now = isLive(row, TODAY)
        return (
          <div
            key={time}
            className={cn(
              'w-40 flex-none rounded-lg border bg-card p-3',
              now ? 'border-primary ring-[3px] ring-primary/10' : 'border-border',
            )}
          >
            <div className="text-[11.5px] font-bold tabular-nums text-muted-foreground">
              {time}
              {now && ` · ${t.nowShort}`}
            </div>
            <b className="mt-[5px] block text-[13.5px]">
              <span className="me-[5px] inline-block h-[9px] w-[9px] rounded-[3px] align-middle" style={{ background: s.color }} />
              {t.subject[key]}
            </b>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">{s.teacher}</div>
            {now && (
              <Link href="/live" className={cn(buttonVariants({ size: 'sm' }), 'mt-2')}>
                <PlayIcon />
                {t.joinNow}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
