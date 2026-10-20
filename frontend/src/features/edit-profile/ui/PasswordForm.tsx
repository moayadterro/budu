'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Appear } from '@/shared/ui/motion'
import { PasswordInput } from '@/shared/ui/password-input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { changePassword } from '../server/actions'
import type { ProfileState } from '../model/types'

const idle: ProfileState = { status: 'idle' }

export function PasswordForm() {
  const t = useT()
  const [state, action] = useActionState(changePassword, idle)
  const form = useRef<HTMLFormElement>(null)
  const s = t.account
  useEffect(() => {
    if (state.status === 'saved') form.current?.reset()
  }, [state])
  return (
    <form ref={form} action={action}>
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>}
      <Field label={s.currentPassword}>
        <PasswordInput name="current" required autoComplete="current-password" />
      </Field>
      <Field label={s.newPassword} hint={s.passwordRules}>
        <PasswordInput name="password" required autoComplete="new-password" />
      </Field>
      <Field label={s.confirmPassword}>
        <PasswordInput name="confirmPassword" required autoComplete="new-password" />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton label={s.changePassword} pendingLabel={s.changing} />
        {state.status === 'saved' && (
          <Appear key={state.at}>
            <span className="text-sm font-medium text-success">{s.passwordChanged}</span>
          </Appear>
        )}
      </div>
    </form>
  )
}
