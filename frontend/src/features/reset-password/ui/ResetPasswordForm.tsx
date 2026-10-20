'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { PasswordInput } from '@/shared/ui/password-input'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { resetPassword, ResetState } from '../server/actions'

const idle: ResetState = { status: 'idle' }

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useT()
  const [state, action] = useActionState(resetPassword, idle)
  const s = t.auth.reset
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state.status === 'error' && (
        <Appear>
          <Alert>
            {s.errors[state.error]}{' '}
            {state.error === 'invalidLink' && (
              <Link href="/forgot-password" className="underline underline-offset-2">
                {s.requestNew}
              </Link>
            )}
          </Alert>
        </Appear>
      )}
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
