'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { courseColor, isAllDay, type CalendarItem } from '@/entities/schedule'
import { DeleteEventButton } from '@/features/school-events'
import type { Role } from '@/shared/config/nav'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib/cn'
import { tint } from '@/shared/lib/color'
import { useLocale, useT } from '@/shared/i18n'

/**
 * Week timetable (calendar best practices): minimal chrome; today highlighted with a live current-time
 * line; lessons placed by time and length, one calm colour per course, overlaps side by side; school
 * events in an all-day lane; details in a popover. Mobile: day strip + agenda list.
 * Renders after mount so every time is in the viewer's own time zone.
 */

const PX_PER_HOUR = 56
const DAY_MS = 86400000

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parseIso = (s: string | null) => {
  const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const startOf = (i: CalendarItem) => new Date(i.start * 1000)
const endOf = (i: CalendarItem) => new Date((i.start + Math.max(i.duration, 0)) * 1000)

/** Does the item happen on this day (all-day items may span several days)? */
function onDay(i: CalendarItem, day: Date) {
  const s = startOf(i)
  if (!isAllDay(i)) return sameDay(s, day)
  const dayEnd = addDays(day, 1)
  return s < dayEnd && (i.duration === 0 ? sameDay(s, day) : endOf(i) > day)
}

/** Side-by-side columns for overlapping timed items of one day. */
function layout(items: CalendarItem[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.duration - a.duration)
  const placed: Array<{ item: CalendarItem; col: number; cols: number }> = []
  let cluster: typeof placed = []
  let colEnds: number[] = []
  let clusterEnd = 0
  const close = () => {
    for (const p of cluster) p.cols = colEnds.length
    cluster = []
    colEnds = []
  }
  for (const item of sorted) {
    const end = item.start + Math.max(item.duration, 900)
    if (cluster.length && item.start >= clusterEnd) close()
    let col = colEnds.findIndex((e) => e <= item.start)
    if (col === -1) {
      col = colEnds.length
      colEnds.push(end)
    } else colEnds[col] = end
    const p = { item, col, cols: 1 }
    cluster.push(p)
    placed.push(p)
    clusterEnd = Math.max(clusterEnd, end)
  }
  close()
  return placed
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** Where an item links to, by role. */
const courseHref = (role: Role, courseId: number) =>
  role === 'student' ? `/classes/${courseId}` : role === 'manager' ? `/gradebook?course=${courseId}` : `/courses/${courseId}`

function ItemDetails({ item, role, canManageEvents }: { item: CalendarItem; role: Role; canManageEvents: boolean }) {
  const t = useT()
  const locale = useLocale()
  const s = t.timetable
  const day = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(startOf(item))
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 size-2.5 flex-none rounded-full" style={{ background: courseColor(item.courseId) }} />
        <div className="min-w-0">
          <div className="font-medium leading-snug">{item.title}</div>
          <div className="text-sm text-muted-foreground">
            {day}
            {!isAllDay(item) && ` · ${time.format(startOf(item))}–${time.format(endOf(item))}`}
            {isAllDay(item) && ` · ${s.allDay}`}
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {item.kind === 'event' && (
          <>
            <dt className="text-muted-foreground">{s.schoolEvent}</dt>
            <dd>{item.school}</dd>
          </>
        )}
        {item.className && (
          <>
            <dt className="text-muted-foreground">{s.class}</dt>
            <dd>{item.className}</dd>
          </>
        )}
        {item.teachers && (
          <>
            <dt className="text-muted-foreground">{s.teacher}</dt>
            <dd>{item.teachers}</dd>
          </>
        )}
        {item.description && (
          <>
            <dt className="text-muted-foreground">{s.place}</dt>
            <dd className="whitespace-pre-line">{item.description}</dd>
          </>
        )}
      </dl>
      {item.courseId && (
        <Button size="sm" variant="outline" asChild>
          <Link href={courseHref(role, item.courseId)}>{s.openCourse}</Link>
        </Button>
      )}
      {item.kind === 'event' && canManageEvents && <DeleteEventButton eventId={item.id} />}
    </div>
  )
}

/** A timed block / chip with its details popover. */
function ItemButton({
  item,
  role,
  canManageEvents,
  past,
  className,
  style,
  children,
}: {
  item: CalendarItem
  role: Role
  canManageEvents: boolean
  past: boolean
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}) {
  const color = courseColor(item.courseId)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'overflow-hidden rounded-md border-s-[3px] text-start text-xs transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-ring',
            past && 'opacity-55',
            className,
          )}
          style={{ background: tint(color, 14), borderInlineStartColor: color, color: `color-mix(in srgb, ${color} 55%, var(--foreground))`, ...style }}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <ItemDetails item={item} role={role} canManageEvents={canManageEvents} />
      </PopoverContent>
    </Popover>
  )
}

export function WeekCalendar({
  items,
  week,
  role,
  canManageEvents = false,
  actions,
}: {
  items: CalendarItem[]
  /** Monday of the week to show (YYYY-MM-DD), or null for this week */
  week: string | null
  role: Role
  canManageEvents?: boolean
  actions?: ReactNode
}) {
  const t = useT()
  const locale = useLocale()
  const s = t.timetable
  const now = useNow()
  const [mounted, setMounted] = useState(false)
  const [picked, setPicked] = useState<Date | null>(null)
  useEffect(() => setMounted(true), [])

  const monday = useMemo(() => mondayOf(parseIso(week) ?? new Date()), [week])
  const allDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday])
  const inWeek = useMemo(() => items.filter((i) => allDays.some((d) => onDay(i, d))), [items, allDays])
  // weekends only when something happens on them
  const days = allDays.filter((d, i) => i < 5 || inWeek.some((it) => onDay(it, d)))
  const timed = inWeek.filter((i) => !isAllDay(i))
  const hours = useMemo(() => {
    const starts = timed.map((i) => startOf(i).getHours())
    const ends = timed.map((i) => {
      const e = endOf(i)
      return e.getHours() + (e.getMinutes() > 0 ? 1 : 0)
    })
    const from = Math.max(0, Math.min(8, ...starts))
    const to = Math.min(24, Math.max(17, ...ends))
    return { from, to }
  }, [timed])

  const fmtTime = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
  // gutter labels: short hours ("9 AM" / "09") so they never wrap
  const fmtHour = new Intl.DateTimeFormat(locale, { hour: 'numeric' })
  const range = (() => {
    const f = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    try {
      return f.formatRange(monday, addDays(monday, 6))
    } catch {
      return `${f.format(monday)} – ${f.format(addDays(monday, 6))}`
    }
  })()
  const today = startOfDay(now)
  const selected = picked && allDays.some((d) => sameDay(d, picked)) ? picked : allDays.find((d) => sameDay(d, today)) ?? monday
  const isPast = (i: CalendarItem) => endOf(i) < now && !(isAllDay(i) && sameDay(startOf(i), today))

  const header = (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" asChild>
          <Link href="/timetable">{s.today}</Link>
        </Button>
        <Button variant="ghost" size="icon-sm" asChild aria-label={s.prev}>
          <Link href={`/timetable?week=${isoDate(addDays(monday, -7))}`}>
            <Icon name="back" className="rtl:-scale-x-100" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon-sm" asChild aria-label={s.next}>
          <Link href={`/timetable?week=${isoDate(addDays(monday, 7))}`}>
            <Icon name="chevRight" className="rtl:-scale-x-100" />
          </Link>
        </Button>
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{mounted ? range : ' '}</h2>
      <div className="ms-auto">{actions}</div>
    </div>
  )

  if (!mounted) {
    return (
      <>
        {header}
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </>
    )
  }

  const dayLabel = (d: Date, style: 'short' | 'long' = 'short') => new Intl.DateTimeFormat(locale, { weekday: style }).format(d)
  const gridHeight = (hours.to - hours.from) * PX_PER_HOUR
  const nowTop = ((now.getHours() + now.getMinutes() / 60 - hours.from) * PX_PER_HOUR) | 0
  const allDayItems = (d: Date) => inWeek.filter((i) => isAllDay(i) && onDay(i, d))
  const hasAllDay = days.some((d) => allDayItems(d).length > 0)

  return (
    <>
      {header}

      {/* ---------- desktop: week grid ---------- */}
      <Card className="hidden gap-0 overflow-hidden py-0 md:flex">
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}>
          {/* day headers */}
          <div className="border-b" />
          {days.map((d) => {
            const isToday = sameDay(d, today)
            return (
              <div key={d.toISOString()} className={cn('flex flex-col items-center gap-0.5 border-b border-s py-2.5', isToday && 'bg-primary/[0.04]')}>
                <span className={cn('text-xs font-medium uppercase tracking-wide', isToday ? 'text-primary' : 'text-muted-foreground')}>{dayLabel(d)}</span>
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-full text-base font-semibold tabular-nums',
                    isToday && 'bg-primary text-primary-foreground',
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
            )
          })}

          {/* all-day lane (school events) */}
          {hasAllDay && (
            <>
              <div className="flex items-start justify-end border-b px-2 py-1.5 text-[11px] text-muted-foreground">{s.allDay}</div>
              {days.map((d) => (
                <div key={d.toISOString()} className={cn('flex flex-col gap-1 border-b border-s p-1', sameDay(d, today) && 'bg-primary/[0.04]')}>
                  {allDayItems(d).map((i) => (
                    <ItemButton key={i.id} item={i} role={role} canManageEvents={canManageEvents} past={isPast(i)} className="px-2 py-1">
                      <span className="block truncate font-medium">{i.title}</span>
                    </ItemButton>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* time gutter */}
          <div className="relative" style={{ height: gridHeight }}>
            {Array.from({ length: hours.to - hours.from }, (_, h) => (
              <span
                key={h}
                className="absolute end-2 -translate-y-1/2 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground"
                style={{ top: h * PX_PER_HOUR }}
              >
                {h === 0 ? '' : fmtHour.format(new Date(2024, 0, 1, hours.from + h))}
              </span>
            ))}
          </div>

          {/* day columns */}
          {days.map((d) => {
            const isToday = sameDay(d, today)
            const placed = layout(timed.filter((i) => onDay(i, d)))
            return (
              <div key={d.toISOString()} className={cn('relative border-s', isToday && 'bg-primary/[0.04]')} style={{ height: gridHeight }}>
                {Array.from({ length: hours.to - hours.from }, (_, h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: h * PX_PER_HOUR }} />
                ))}
                {placed.map(({ item, col, cols }) => {
                  const st = startOf(item)
                  const top = (st.getHours() + st.getMinutes() / 60 - hours.from) * PX_PER_HOUR
                  const height = Math.max((item.duration / 3600) * PX_PER_HOUR - 2, 22)
                  const compact = height < 44
                  const live = now >= st && now < endOf(item)
                  return (
                    <ItemButton
                      key={item.id}
                      item={item}
                      role={role}
                      canManageEvents={canManageEvents}
                      past={isPast(item)}
                      className={cn('absolute px-2 py-1', live && 'ring-2 ring-destructive/40')}
                      style={{ top: top + 1, height, insetInlineStart: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` }}
                    >
                      <span className={cn('block truncate font-semibold', compact && 'inline')}>{item.title}</span>
                      <span className={cn('tabular-nums opacity-80', compact ? 'ms-1' : 'block')}>
                        {fmtTime.format(st)}–{fmtTime.format(endOf(item))}
                      </span>
                      {!compact && (item.className || item.description) && (
                        <span className="block truncate opacity-80">{[item.className, item.description].filter(Boolean).join(' · ')}</span>
                      )}
                    </ItemButton>
                  )
                })}
                {isToday && nowTop >= 0 && nowTop <= gridHeight && (
                  <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }} aria-label={s.now}>
                    <div className="h-0.5 bg-destructive" />
                    <div className="absolute -start-1 -top-1 size-2.5 rounded-full bg-destructive" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {inWeek.length === 0 && <p className="border-t px-4 py-3 text-center text-sm text-muted-foreground">{s.emptyWeek}</p>}
      </Card>

      {/* ---------- mobile: day strip + agenda ---------- */}
      <div className="md:hidden">
        <div className="mb-3 grid grid-cols-7 gap-1">
          {allDays.map((d) => {
            const isSel = sameDay(d, selected)
            const isToday = sameDay(d, today)
            const busy = inWeek.some((i) => onDay(i, d))
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setPicked(d)}
                aria-pressed={isSel}
                className="flex flex-col items-center gap-1 rounded-lg py-1.5"
              >
                <span className={cn('text-[11px] font-medium uppercase', isToday ? 'text-primary' : 'text-muted-foreground')}>{dayLabel(d)}</span>
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-full text-sm font-semibold tabular-nums',
                    isSel ? 'bg-primary text-primary-foreground' : isToday && 'text-primary',
                  )}
                >
                  {d.getDate()}
                </span>
                <span className={cn('size-1 rounded-full', busy ? 'bg-primary/60' : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
        <h3 className="mb-2 text-sm font-semibold">
          {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(selected)}
        </h3>
        {(() => {
          const list = inWeek
            .filter((i) => onDay(i, selected))
            .sort((a, b) => Number(isAllDay(b)) - Number(isAllDay(a)) || a.start - b.start)
          if (list.length === 0) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{s.noItems}</p>
          return (
            <div className="flex flex-col gap-2">
              {list.map((i) => (
                <div key={i.id} className="flex gap-3">
                  <div className="w-12 flex-none pt-2 text-end text-xs font-medium tabular-nums text-muted-foreground">
                    {isAllDay(i) ? s.allDay : fmtTime.format(startOf(i))}
                  </div>
                  <ItemButton item={i} role={role} canManageEvents={canManageEvents} past={isPast(i)} className="flex-1 px-3 py-2.5 text-sm">
                    <span className="block font-semibold">{i.title}</span>
                    <span className="block text-xs opacity-80">
                      {!isAllDay(i) && `${fmtTime.format(startOf(i))}–${fmtTime.format(endOf(i))}`}
                      {[i.className, i.description, i.kind === 'event' ? i.school : ''].filter(Boolean).length > 0 &&
                        `${isAllDay(i) ? '' : ' · '}${[i.className, i.description, i.kind === 'event' ? i.school : ''].filter(Boolean).join(' · ')}`}
                    </span>
                    {i.kind === 'event' && (
                      <Badge variant="warning" className="mt-1.5">
                        {s.schoolEvent}
                      </Badge>
                    )}
                  </ItemButton>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </>
  )
}
