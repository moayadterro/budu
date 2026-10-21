'use client'

import { useActionState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { createClassAction, deleteClassAction, renameClassAction, type ClassFormState } from '../server/actions'

const idle: ClassFormState = { status: 'idle' }

/** Manager: name (+ description) of a new class. */
export function CreateClassForm() {
  const t = useT()
  const s = t.classes
  const [state, action] = useActionState(createClassAction, idle)
  return (
    <form action={action}>
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{t.courses.errors.invalid}</Alert>}
      <div className="grid gap-x-4 sm:grid-cols-[1fr_2fr]">
        <Field label={s.name}>
          <Input name="name" required maxLength={100} placeholder={s.namePh} />
        </Field>
        <Field label={s.desc}>
          <Input name="description" maxLength={1000} />
        </Field>
      </div>
      <SubmitButton label={s.create} pendingLabel={s.creating} />
    </form>
  )
}

/** Manager: rename / describe / delete a class. */
export function ClassDetailsForm({ classId, name, description }: { classId: number; name: string; description: string }) {
  const t = useT()
  const s = t.classes
  const [state, action] = useActionState(renameClassAction, idle)
  return (
    <div className="flex flex-col gap-4">
      <form action={action}>
        {state.status === 'error' && <Alert variant="destructive" className="mb-4">{t.courses.errors.invalid}</Alert>}
        <input type="hidden" name="classId" value={classId} />
        <Field label={s.name}>
          <Input name="name" required maxLength={100} defaultValue={name} />
        </Field>
        <Field label={s.desc}>
          <Textarea name="description" maxLength={1000} defaultValue={description} className="min-h-16" />
        </Field>
        <div className="flex items-center gap-3">
          <SubmitButton label={s.save} pendingLabel={s.saving} variant="outline" />
          {state.status === 'saved' && (
            <Appear key={state.at}>
              <span className="text-sm font-medium text-success">{s.saved}</span>
            </Appear>
          )}
        </div>
      </form>
      <form action={deleteClassAction} className="flex flex-wrap items-center gap-3 border-t pt-4">
        <input type="hidden" name="classId" value={classId} />
        <ConfirmButton label={s.deleteClass} confirmLabel={s.confirmDelete} />
        <span className="text-xs text-muted-foreground">{s.deleteHint}</span>
      </form>
    </div>
  )
}
