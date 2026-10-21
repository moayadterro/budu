'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { inviteToSchool, type InviteState } from '../server/actions'

const idle: InviteState = { status: 'idle' }

/** Name, email and role of the person to invite into the school. */
export function InviteForm() {
  const t = useT()
  const s = t.school
  const [state, action] = useActionState(inviteToSchool, idle)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.status === 'created' || state.status === 'added') form.current?.reset()
  }, [state])
  const ok = state.status === 'created' || state.status === 'added'
  return (
    <form ref={form} action={action}>
      {state.status !== 'idle' && (
        <Alert key={state.at} variant={ok ? 'success' : state.status === 'already' ? 'info' : 'destructive'} className="mb-4">
          {s.invited[state.status]}
        </Alert>
      )}
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label={s.firstName}>
          <Input name="firstName" required maxLength={100} autoComplete="off" />
        </Field>
        <Field label={s.lastName}>
          <Input name="lastName" required maxLength={100} autoComplete="off" />
        </Field>
        <Field label={s.email}>
          <Input name="email" type="email" required autoComplete="off" />
        </Field>
        <Field label={s.role}>
          <NativeSelect name="role" defaultValue="student" className="w-full">
            {(['student', 'teacher', 'manager'] as const).map((r) => (
              <NativeSelectOption key={r} value={r}>
                {t.role[r]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <SubmitButton label={s.sendInvite} pendingLabel={s.sending} />
    </form>
  )
}
