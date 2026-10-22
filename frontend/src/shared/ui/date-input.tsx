'use client'

import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/lib/cn'
import { useLocale, useT, type Locale } from '@/shared/i18n'

/*
 * Date fields in the APP's language. The browser's own <input type="date"> is drawn in the
 * browser's language (a Russian Chrome shows Russian dates on the Arabic UI) and a page can't
 * change that — so dates are picked here: the label and the calendar use Intl in the UI language,
 * the week starts on that language's first day, and the grid mirrors in right-to-left languages.
 * Values are the same strings the native inputs used: "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm".
 */

const pad = (n: number) => String(n).padStart(2, '0')
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseIso = (v: string | undefined) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** The language's first day of the week (0 = Sunday): Saturday for Arabic, Monday for Russian … */
function firstDayOf(locale: Locale) {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const day = (l.getWeekInfo?.() ?? l.weekInfo)?.firstDay
    return day ? day % 7 : 1
  } catch {
    return 1
  }
}

type DateInputProps = {
  /** controlled value "YYYY-MM-DD" ('' = none) */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** form field name: a hidden input carries the value, like the native input did */
  name?: string
  required?: boolean
  /** may be emptied ("Clear" in the calendar) */
  clearable?: boolean
  id?: string
  className?: string
}

/** A date picker in the UI language (see the note above). */
export function DateInput({ value, defaultValue, onChange, name, required, clearable, id, className }: DateInputProps) {
  const t = useT()
  const locale = useLocale()
  const [inner, setInner] = useState(value ?? defaultValue ?? '')
  useEffect(() => {
    if (value !== undefined) setInner(value)
  }, [value])
  const [open, setOpen] = useState(false)
  const selected = parseIso(inner)
  const label = selected ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(selected) : t.datePick

  const choose = (v: string) => {
    setInner(v)
    onChange?.(v)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            'flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-start text-sm shadow-xs transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <Icon name="cal" className="size-4 flex-none text-muted-foreground" />
          <span className="truncate">{label}</span>
        </button>
      </PopoverTrigger>
      {name && <input type="hidden" name={name} value={inner} required={required} />}
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          locale={locale}
          selected={selected}
          onPick={(d) => choose(toIso(d))}
          labels={{ prev: t.monthPrev, next: t.monthNext }}
        />
        {clearable && selected && (
          <button type="button" onClick={() => choose('')} className="mt-2 w-full rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            {t.dateClear}
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Date + time ("YYYY-MM-DDTHH:mm", '' = none) — our date picker beside a time field. */
export function DateTimeInput({
  value,
  onChange,
  defaultTime = '09:00',
  clearable,
  id,
  className,
}: {
  value: string
  onChange: (value: string) => void
  /** the time used when a date is picked first */
  defaultTime?: string
  clearable?: boolean
  id?: string
  className?: string
}) {
  const [date = '', time = ''] = value ? value.split('T') : []
  return (
    <div className={cn('flex gap-2', className)}>
      <DateInput id={id} value={date} clearable={clearable} onChange={(d) => onChange(d ? `${d}T${time || defaultTime}` : '')} className="flex-1" />
      <Input
        type="time"
        value={time}
        disabled={!date}
        onChange={(e) => date && onChange(`${date}T${e.target.value || defaultTime}`)}
        className="w-28 flex-none tabular-nums"
      />
    </div>
  )
}

function Calendar({
  locale,
  selected,
  onPick,
  labels,
}: {
  locale: Locale
  selected: Date | null
  onPick: (d: Date) => void
  labels: { prev: string; next: string }
}) {
  const today = new Date()
  const [month, setMonth] = useState(() => {
    const base = selected ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const first = firstDayOf(locale)
  const fmt = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      day: new Intl.NumberFormat(locale),
      full: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
    }),
    [locale],
  )
  // 2024-01-07 was a Sunday: weekday names starting at the language's first day. Short names
  // ("пн", "Mon") when they fit the column, else the narrow ones (Arabic short names are whole words)
  const weekdays = useMemo(() => {
    const names = (weekday: 'short' | 'narrow') =>
      Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday }).format(new Date(2024, 0, 7 + ((first + i) % 7))))
    const short = names('short')
    return short.every((n) => n.length <= 3) ? short : names('narrow')
  }, [locale, first])
  const lead = (month.getDay() - first + 7) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  const same = (a: Date | null, b: Date) => !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))

  return (
    <div className="w-64">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label={labels.prev} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Icon name="back" className="size-4 rtl:rotate-180" />
        </button>
        <span className="text-sm font-semibold">{fmt.title.format(month)}</span>
        <button type="button" onClick={() => shift(1)} aria-label={labels.next} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Icon name="chevRight" className="size-4 rtl:rotate-180" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekdays.map((w) => (
          <span key={w} className="py-1 text-xs font-medium text-muted-foreground">
            {w}
          </span>
        ))}
        {cells.map((d, i) =>
          d ? (
            <button
              key={i}
              type="button"
              onClick={() => onPick(d)}
              aria-label={fmt.full.format(d)}
              aria-pressed={same(selected, d)}
              className={cn(
                'grid h-8 place-items-center rounded-md text-sm tabular-nums transition-colors',
                same(selected, d) ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-muted',
                !same(selected, d) && same(today, d) && 'font-semibold text-primary ring-1 ring-primary/40',
              )}
            >
              {fmt.day.format(d.getDate())}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  )
}
