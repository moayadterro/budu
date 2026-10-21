'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { postAnnouncementAction, type AnnouncementState } from '../server/actions'

const idle: AnnouncementState = { status: 'idle' }

/**
 * "New announcement" button + dialog. School managers pass their `classes` and choose the whole school
 * or one class; on a course page pass `courseId` (the announcement goes to that course).
 */
export function NewAnnouncementDialog({ classes = [], courseId }: { classes?: Array<{ id: number; name: string }>; courseId?: number }) {
  const t = useT()
  const s = t.announcements
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState('school') // 'school' | class id
  const [state, action] = useActionState(postAnnouncementAction, idle)
  useEffect(() => {
    if (state.status === 'saved') setOpen(false)
  }, [state])
  const audience = courseId ? 'course' : to === 'school' ? 'school' : 'class'
  const targetId = courseId ?? (to === 'school' ? '' : to)
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setTo('school')
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
          <input type="hidden" name="targetId" value={targetId} />
          {state.status === 'error' && (
            <Alert key={state.at} variant="destructive" className="mb-4">
              {state.error === 'invalid' ? s.invalid : t.family.errors.server}
            </Alert>
          )}
          {!courseId && classes.length > 0 && (
            <Field label={s.sendTo}>
              <NativeSelect value={to} onChange={(e) => setTo(e.target.value)} className="w-full">
                <NativeSelectOption value="school">{s.wholeSchool}</NativeSelectOption>
                {classes.map((k) => (
                  <NativeSelectOption key={k.id} value={String(k.id)}>
                    {k.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}
          <Field label={s.titleLabel}>
            <Input name="title" required maxLength={200} />
          </Field>
          <Field label={s.bodyLabel}>
            <Textarea name="body" rows={5} maxLength={4000} />
          </Field>
          <SubmitButton label={s.post} pendingLabel={s.post} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
