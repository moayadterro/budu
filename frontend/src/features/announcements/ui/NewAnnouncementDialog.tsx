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
import { useT } from '@/shared/i18n'
import { postAnnouncementAction, type AnnouncementState } from '../server/actions'

const idle: AnnouncementState = { status: 'idle' }

/** Manager: "New announcement" button + dialog. */
export function NewAnnouncementDialog() {
  const t = useT()
  const s = t.announcements
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(postAnnouncementAction, idle)
  useEffect(() => {
    if (state.status === 'saved') setOpen(false)
  }, [state])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Icon name="plus" />
          {s.new}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{s.new}</DialogTitle>
          <DialogDescription>{s.sub}</DialogDescription>
        </DialogHeader>
        <form action={action}>
          {state.status === 'error' && (
            <Alert key={state.at} variant="destructive" className="mb-4">
              {state.error === 'invalid' ? s.invalid : t.family.errors.server}
            </Alert>
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
