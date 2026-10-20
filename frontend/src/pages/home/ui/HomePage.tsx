import Link from 'next/link'
import { ScreenHead } from '@/shared/ui/screen-head'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { Icon, PlayIcon } from '@/shared/ui/icon'
import { getSession } from '@/entities/session/server'
import { SubjectCard } from '@/entities/subject'
import { HOMEWORK, STUDENT, SUBJECTS, TIMES, TODAY, WEEK, isLive } from '@/shared/mock'
import { cn } from '@/shared/lib/cn'
import { getT } from '@/shared/i18n/server'

/** Student dashboard. */
export async function HomePage() {
  const t = await getT()
  const user = await getSession()
  const firstName = user?.name.split(' ')[0] ?? ''
  return (
    <>
      <ScreenHead eyebrow={t.home.todayDate} title={t.home.hi(firstName)} sub={t.home.classLine} />

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
              <CardTitle>{t.home.subjectsTitle}</CardTitle>
              <CardAction>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link href="/classes">{t.viewAll}</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {(['math', 'phys', 'rus', 'eng'] as const).map((s) => (
                <SubjectCard key={s} subject={s} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.home.hwTitle}</CardTitle>
              <CardAction>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link href="/classes/math/homework">{t.viewAll}</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {HOMEWORK.map((hw) => (
                <Item key={hw.title} size="sm" asChild className="px-2">
                  <Link href="/classes/math/homework">
                    <ItemMedia
                      variant="icon"
                      className={cn(hw.urgent ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground')}
                    >
                      <Icon name="alert" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{hw.title}</ItemTitle>
                      <ItemDescription>{hw.meta}</ItemDescription>
                    </ItemContent>
                    <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">{hw.due}</span>
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
