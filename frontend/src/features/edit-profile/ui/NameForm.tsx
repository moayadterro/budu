'use client'

import { useActionState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { saveName } from '../server/actions'
import { NAME_MAX, type ProfileState } from '../model/types'

const idle: ProfileState = { status: 'idle' }

export function NameForm({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) {
  const t = useT()
  const [state, action] = useActionState(saveName, idle)
  const s = t.account
  return (
    <form action={action}>
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>}
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label={s.firstName}>
          <Input name="firstName" required maxLength={NAME_MAX} defaultValue={firstName} autoComplete="given-name" />
        </Field>
        <Field label={s.lastName}>
          <Input name="lastName" required maxLength={NAME_MAX} defaultValue={lastName} autoComplete="family-name" />
        </Field>
      </div>
      <Field label={s.email}>
        <Input value={email} disabled readOnly />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton label={s.save} pendingLabel={s.saving} />
        {state.status === 'saved' && (
          <Appear key={state.at}>
            <span className="text-sm font-medium text-success">{s.saved}</span>
          </Appear>
        )}
      </div>
    </form>
  )
}
