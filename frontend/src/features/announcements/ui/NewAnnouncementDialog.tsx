'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { postAnnouncementAction, type AnnouncementState } from '../server/actions'

const idle: AnnouncementState = { status: 'idle' }

/**
 * "New announcement" button + dialog. School managers pass their `classes` and send to the whole school
 * or to one or more classes at once; on a course page pass `courseId` (the announcement goes to that course).
 */
export function NewAnnouncementDialog({ classes = [], courseId }: { classes?: Array<{ id: number; name: string }>; courseId?: number }) {
  const t = useT()
  const s = t.announcements
  const [open, setOpen] = useState(false)
  const [toClasses, setToClasses] = useState(false)
  const [picked, setPicked] = useState<number[]>([])
  const [state, action] = useActionState(postAnnouncementAction, idle)
  useEffect(() => {
    if (state.status === 'saved') setOpen(false)
  }, [state])
  const audience = courseId ? 'course' : toClasses ? 'class' : 'school'
  const noneChosen = audience === 'class' && picked.length === 0
  const choice = (on: boolean) =>
    cn(
      'h-9 rounded-md border px-3 text-sm font-medium transition-colors',
      on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
    )
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          setToClasses(false)
          setPicked([])
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Icon name="plus" />
          {s.new}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{s.new}</DialogTitle>
          <DialogDescription>{courseId ? s.courseSub : s.sub}</DialogDescription>
        </DialogHeader>
        <form action={action}>
          <input type="hidden" name="audience" value={audience} />
          {courseId && <input type="hidden" name="targetId" value={courseId} />}
          {audience === 'class' && picked.map((id) => <input key={id} type="hidden" name="classIds" value={id} />)}
          {state.status === 'error' && (
            <Alert key={state.at} variant="destructive" className="mb-4">
              {state.error === 'invalid' ? s.invalid : t.family.errors.server}
            </Alert>
          )}
          {!courseId && classes.length > 0 && (
            <fieldset className="mb-4 flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{s.sendTo}</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={!toClasses} onClick={() => setToClasses(false)} className={choice(!toClasses)}>
                  {s.wholeSchool}
                </button>
                <button type="button" aria-pressed={toClasses} onClick={() => setToClasses(true)} className={choice(toClasses)}>
                  {s.someClasses}
                </button>
              </div>
              {toClasses && (
                <>
                  <p className="text-xs text-muted-foreground">{s.pickClasses}</p>
                  <div className="flex flex-wrap gap-2">
                    {classes.map((k) => {
                      const on = picked.includes(k.id)
                      return (
                        <button
                          key={k.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setPicked((cur) => (on ? cur.filter((x) => x !== k.id) : [...cur, k.id]))}
                          className={cn(choice(on), 'min-w-12')}
                        >
                          {k.name}
                        </button>
                      )
                    })}
                  </div>
                  {noneChosen && <p className="text-xs text-destructive">{s.noClasses}</p>}
                </>
              )}
            </fieldset>
          )}
          <Field label={s.titleLabel}>
            <Input name="title" required maxLength={200} />
          </Field>
          <Field label={s.bodyLabel}>
            <Textarea name="body" rows={5} maxLength={4000} />
          </Field>
          <SubmitButton label={s.post} pendingLabel={s.post} disabled={noneChosen} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
