'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { PasswordInput } from '@/shared/ui/password-input'
import { PasswordMatch, PasswordStrength } from '@/shared/ui/password-strength'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { acceptInvite, type AcceptState } from '../server/actions'

const idle: AcceptState = { status: 'idle' }

export function AcceptInviteForm({ token }: { token: string }) {
  const t = useT()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const s = t.auth.invite
  const [state, action] = useActionState(acceptInvite, idle)
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>}
      <Field label={s.password}>
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      </Field>
      <PasswordStrength value={pw} labels={t.signUp.strength} />
      <Field label={s.confirm}>
        <PasswordInput name="confirm" required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </Field>
      <PasswordMatch password={pw} confirm={pw2} labels={t.signUp} />
      <SubmitButton label={s.submit} pendingLabel={s.submitting} size="lg" className="w-full" />
    </form>
  )
}
