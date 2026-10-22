'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { resendVerification, signIn, SignInState } from '../server/actions'

const idle: SignInState = { status: 'idle' }

export function SignInForm({ next, notice }: { next?: string; notice?: 'verified' | 'reset' | 'invited' }) {
  const t = useT()
  const [state, action] = useActionState(signIn, idle)
  const [resendState, resend] = useActionState(resendVerification, idle)
  const s = t.auth.signIn

  return (
    <>
      {notice && state.status === 'idle' && <Alert variant="success">{notice === 'verified' ? s.verified : notice === 'invited' ? s.invited : s.resetDone}</Alert>}
      {state.status === 'error' && (
        <Appear>
          <Alert variant="destructive">{s.errors[state.error]}</Alert>
        </Appear>
      )}
      {state.status === 'notVerified' && (
        <Appear>
          <Alert variant="info">
            {resendState.status === 'resent' ? (
              s.resent
            ) : (
              <form action={resend} className="flex flex-wrap items-center gap-x-2">
                <span>{s.notVerified}</span>
                <input type="hidden" name="email" value={state.email} />
                <button type="submit" className="underline underline-offset-2">
                  {s.resend}
                </button>
              </form>
            )}
          </Alert>
        </Appear>
      )}

      <form action={action}>
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={s.email}>
          <Input name="email" type="email" required autoComplete="email" autoFocus />
        </Field>
        <Field label={s.password}>
          <PasswordInput name="password" required autoComplete="current-password" />
        </Field>
        <div className="-mt-2 mb-4 text-end">
          <Link href="/forgot-password" className="text-xs font-semibold text-primary">
            {s.forgot}
          </Link>
        </div>
        <SubmitButton label={s.submit} pendingLabel={s.submitting} size="lg" className="w-full" />
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        {s.noAccount}{' '}
        <Link href="/register" className="font-semibold text-primary">
          {s.register}
        </Link>
      </p>
    </>
  )
}
