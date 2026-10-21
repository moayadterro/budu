'use client'

import { useActionState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { PasswordInput } from '@/shared/ui/password-input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { acceptInvite, type AcceptState } from '../server/actions'

const idle: AcceptState = { status: 'idle' }

export function AcceptInviteForm({ token }: { token: string }) {
  const t = useT()
  const s = t.auth.invite
  const [state, action] = useActionState(acceptInvite, idle)
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>}
      <Field label={s.password} hint={t.signUp.passwordHint}>
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" autoFocus />
      </Field>
      <Field label={s.confirm}>
        <PasswordInput name="confirm" required minLength={8} autoComplete="new-password" />
      </Field>
      <SubmitButton label={s.submit} pendingLabel={s.submitting} className="w-full" />
    </form>
  )
}
