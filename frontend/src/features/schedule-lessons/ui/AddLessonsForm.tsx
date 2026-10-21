'use client'

import { FormEvent, useActionState, useMemo, useRef, useState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Appear } from '@/shared/ui/motion'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { cn } from '@/shared/lib/cn'
import { useLocale, useT } from '@/shared/i18n'
import { addLessonsAction, type LessonsState } from '../server/actions'

const idle: LessonsState = { status: 'idle' }
/** JS getDay() numbers, Monday first. */
const WEEK = [1, 2, 3, 4, 5, 6, 0]
const DURATIONS = [30, 40, 45, 50, 60, 90]
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Every start between from and until (inclusive) on the chosen weekdays, at hh:mm local time, as unix seconds. */
function occurrences(from: string, until: string, days: number[], time: string): number[] {
  const [h, m] = time.split(':').map(Number)
  const [fy, fm, fd] = from.split('-').map(Number)
  const [uy, um, ud] = until.split('-').map(Number)
  const end = new Date(uy, um - 1, ud)
  const out: number[] = []
  for (let d = new Date(fy, fm - 1, fd); d <= end && out.length <= 200; d.setDate(d.getDate() + 1)) {
    if (days.includes(d.getDay())) out.push(Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime() / 1000))
  }
  return out
}

/** Teacher / manager: add weekly lessons to a course, for everyone or one enrolled class. */
export function AddLessonsForm({ courseId, classes }: { courseId: number; classes: Array<{ id: number; name: string }> }) {
  const t = useT()
  const locale = useLocale()
  const s = t.schedule
  const [state, action] = useActionState(addLessonsAction, idle)
  const [days, setDays] = useState<number[]>([1])
  const today = useMemo(() => new Date(), [])
  const starts = useRef<HTMLInputElement>(null)
  const dayName = (d: number) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + d)) // 2024-01-07 is a Sunday

  const prepare = (e: FormEvent<HTMLFormElement>) => {
    const f = e.currentTarget
    const value = (n: string) => (f.elements.namedItem(n) as HTMLInputElement).value
    const list = value('from') && value('until') && value('time') ? occurrences(value('from'), value('until'), days, value('time')) : []
    if (starts.current) starts.current.value = JSON.stringify(list)
  }

  return (
    <form action={action} onSubmit={prepare} className="flex flex-col gap-1">
      {state.status === 'error' && <Alert variant="destructive" className="mb-3">{s.errors[state.error]}</Alert>}
      <input type="hidden" name="courseId" value={courseId} />
      <input ref={starts} type="hidden" name="starts" />
      {classes.length > 0 && (
        <Field label={s.forWhom}>
          <NativeSelect name="classId" defaultValue="0" className="w-full sm:w-72">
            <NativeSelectOption value="0">{s.wholeCourse}</NativeSelectOption>
            {classes.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      )}
      <div className="mb-4 grid gap-2">
        <Label>{s.days}</Label>
        <div className="flex flex-wrap gap-1.5">
          {WEEK.map((d) => {
            const on = days.includes(d)
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d]))}
                className={cn(
                  'h-9 min-w-12 rounded-md border px-3 text-sm font-medium transition-colors',
                  on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {dayName(d)}
              </button>
            )
          })}
        </div>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label={s.time}>
          <Input name="time" type="time" required defaultValue="09:00" />
        </Field>
        <Field label={s.duration}>
          <NativeSelect name="duration" defaultValue="45" className="w-full">
            {DURATIONS.map((m) => (
              <NativeSelectOption key={m} value={m}>
                {s.minutes(m)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label={s.from}>
          <Input name="from" type="date" required defaultValue={iso(today)} />
        </Field>
        <Field label={s.until}>
          <Input name="until" type="date" required defaultValue={iso(new Date(today.getTime() + 16 * 7 * 86400000))} />
        </Field>
      </div>
      <Field label={s.room}>
        <Input name="room" maxLength={200} placeholder={s.roomPh} />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton label={s.save} pendingLabel={s.saving} disabled={days.length === 0} />
        {state.status === 'saved' && (
          <Appear key={state.at}>
            <span className="text-sm font-medium text-success">✓</span>
          </Appear>
        )}
      </div>
    </form>
  )
}
