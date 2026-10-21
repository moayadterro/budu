'use client'

import { FormEvent, useActionState, useEffect, useRef, useState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { addSchoolEventAction, type EventState } from '../server/actions'

const idle: EventState = { status: 'idle' }
const local = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min)
}

/** Manager: "Add school event" button + dialog. Times are the manager's local time. */
export function AddSchoolEventDialog({ defaultDate }: { defaultDate: string }) {
  const t = useT()
  const s = t.timetable
  const [open, setOpen] = useState(false)
  const [allDay, setAllDay] = useState(false)
  const [state, action] = useActionState(addSchoolEventAction, idle)
  const [invalid, setInvalid] = useState(false)
  const start = useRef<HTMLInputElement>(null)
  const duration = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (state.status === 'saved') setOpen(false)
  }, [state])

  const prepare = (e: FormEvent<HTMLFormElement>) => {
    const f = e.currentTarget
    const v = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value ?? ''
    const from = allDay ? local(v('date'), '00:00') : local(v('date'), v('startTime'))
    const to = allDay ? new Date(from.getTime() + 86400000) : local(v('date'), v('endTime'))
    const ok = v('title').trim() && !isNaN(from.getTime()) && to > from
    setInvalid(!ok)
    if (!ok) return e.preventDefault()
    start.current!.value = String(Math.floor(from.getTime() / 1000))
    duration.current!.value = String(Math.round((to.getTime() - from.getTime()) / 1000))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icon name="plus" />
          {s.addEvent}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{s.addEvent}</DialogTitle>
          <DialogDescription>{s.addEventSub}</DialogDescription>
        </DialogHeader>
        <form action={action} onSubmit={prepare}>
          {(invalid || state.status === 'error') && (
            <Alert variant="destructive" className="mb-4">
              {s.errors[state.status === 'error' ? state.error : 'invalid']}
            </Alert>
          )}
          <input ref={start} type="hidden" name="start" />
          <input ref={duration} type="hidden" name="duration" />
          <Field label={s.eventTitle}>
            <Input name="title" required maxLength={200} placeholder={s.eventTitlePh} />
          </Field>
          <Field label={s.date}>
            <Input name="date" type="date" required defaultValue={defaultDate} />
          </Field>
          <label className="mb-4 flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-4 accent-primary" />
            {s.allDayToggle}
          </label>
          {!allDay && (
            <div className="grid grid-cols-2 gap-x-4">
              <Field label={s.start}>
                <Input name="startTime" type="time" required defaultValue="10:00" />
              </Field>
              <Field label={s.end}>
                <Input name="endTime" type="time" required defaultValue="11:00" />
              </Field>
            </div>
          )}
          <Field label={s.details}>
            <Input name="details" maxLength={1000} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {s.cancel}
            </Button>
            <SubmitButton label={s.save} pendingLabel={s.saving} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
