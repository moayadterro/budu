'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { courseColor, isAllDay, type CalendarItem } from '@/entities/schedule'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Skeleton } from '@/shared/ui/skeleton'
import { useLocale, useT } from '@/shared/i18n'

/** Student home cards from the real timetable (times in the viewer's zone, so rendered after mount). */

function useClient() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** The next (or current) lesson, big, on the brand gradient. */
export function NextLessonCard({ items }: { items: CalendarItem[] }) {
  const t = useT()
  const locale = useLocale()
  const now = useClient()
  if (!now) return <Skeleton className="h-36 w-full rounded-xl" />
  const next = items
    .filter((i) => i.kind === 'lesson' && (i.start + i.duration) * 1000 > now.getTime())
    .sort((a, b) => a.start - b.start)[0]
  if (!next) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">{t.home.nextLesson}</div>
        {t.home.noUpcoming}
      </div>
    )
  }
  const start = new Date(next.start * 1000)
  const mins = Math.round((start.getTime() - now.getTime()) / 60000)
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
  const when =
    mins <= 0
      ? t.timetable.now
      : mins < 60
        ? t.home.inMin(mins)
        : new Intl.DateTimeFormat(locale, sameDay(start, now) ? { hour: '2-digit', minute: '2-digit' } : { weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(start)
  return (
    <div className="overflow-hidden rounded-xl bg-brand p-6 text-primary-foreground shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
        {mins <= 0 && <span className="dot-live bg-primary-foreground text-primary-foreground" />}
        {t.home.nextLesson} · {when}
      </div>
      <h3 className="mt-2 text-xl font-semibold">{next.title}</h3>
      <p className="mt-1 text-sm opacity-90">
        {[`${time.format(start)}–${time.format(new Date((next.start + next.duration) * 1000))}`, next.className, next.teachers, next.description]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {next.courseId && (
        <Button variant="highlight" className="mt-4" asChild>
          <Link href={`/classes/${next.courseId}`}>{t.timetable.openCourse}</Link>
        </Button>
      )}
    </div>
  )
}

/** Today's lessons and events, as a compact list. */
export function TodayCard({ items }: { items: CalendarItem[] }) {
  const t = useT()
  const locale = useLocale()
  const now = useClient()
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
  const today = now ? items.filter((i) => sameDay(new Date(i.start * 1000), now)).sort((a, b) => a.start - b.start) : []
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.home.todayTitle}</CardTitle>
        <CardAction>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <Link href="/timetable">{t.home.fullWeek}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="gap-1.5">
        {!now && <Skeleton className="h-16 w-full" />}
        {now && today.length === 0 && <p className="text-sm text-muted-foreground">{t.home.noLessonsToday}</p>}
        {today.map((i) => {
          const past = (i.start + i.duration) * 1000 < now!.getTime()
          return (
            <div key={i.id} className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${past ? 'opacity-55' : ''}`}>
              <span className="w-12 flex-none text-xs font-medium tabular-nums text-muted-foreground">
                {isAllDay(i) ? t.timetable.allDay : time.format(new Date(i.start * 1000))}
              </span>
              <span className="h-8 w-1 flex-none rounded-full" style={{ background: courseColor(i.courseId) }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{i.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[i.className, i.description, i.kind === 'event' ? t.timetable.schoolEvent : ''].filter(Boolean).join(' · ')}
                </span>
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

/** Upcoming school events (hidden when there are none). */
export function SchoolEventsCard({ items }: { items: CalendarItem[] }) {
  const t = useT()
  const locale = useLocale()
  const now = useClient()
  if (!now) return null
  const events = items.filter((i) => i.kind === 'event' && (i.start + i.duration) * 1000 >= now.getTime()).slice(0, 4)
  if (events.length === 0) return null
  const when = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const day = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.home.eventsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        {events.map((e) => (
          <div key={e.id} className="flex items-start gap-3">
            <span className="grid size-9 flex-none place-items-center rounded-md bg-highlight/15 text-highlight-foreground">
              <Icon name="cal" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{e.title}</div>
              <div className="text-xs text-muted-foreground">
                {(isAllDay(e) ? day : when).format(new Date(e.start * 1000))}
                {e.description && ` · ${e.description}`}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
