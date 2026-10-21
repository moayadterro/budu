'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { addParentAction, type AddParentState } from '../server/actions'

const idle: AddParentState = { status: 'idle' }

/** Parent's name and email → a request they confirm. */
export function AddParentForm() {
  const t = useT()
  const s = t.family
  const [state, action] = useActionState(addParentAction, idle)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.status === 'sent') form.current?.reset()
  }, [state])
  return (
    <form ref={form} action={action}>
      {state.status === 'sent' && (
        <Alert key={state.at} variant="success" className="mb-4">
          {s.sent(state.email)}
        </Alert>
      )}
      {state.status === 'error' && (
        <Alert key={state.at} variant={state.error === 'pending' || state.error === 'already' ? 'info' : 'destructive'} className="mb-4">
          {s.errors[state.error]}
        </Alert>
      )}
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label={s.parentFirst}>
          <Input name="firstName" required maxLength={100} autoComplete="off" />
        </Field>
        <Field label={s.parentLast}>
          <Input name="lastName" required maxLength={100} autoComplete="off" />
        </Field>
      </div>
      <Field label={s.parentEmail}>
        <Input name="email" type="email" required autoComplete="off" />
      </Field>
      <SubmitButton label={s.send} pendingLabel={s.send} />
    </form>
  )
}
