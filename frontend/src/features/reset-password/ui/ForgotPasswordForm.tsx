'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { ForgotState, requestPasswordReset } from '../server/actions'

const idle: ForgotState = { status: 'idle' }

export function ForgotPasswordForm() {
  const t = useT()
  const [state, action] = useActionState(requestPasswordReset, idle)
  const s = t.auth.forgot
  return (
    <>
      {state.status === 'sent' ? (
        <Appear>
          <h2 className="mb-1 text-[15px] font-bold">{s.sentTitle}</h2>
          <p className="mb-5 text-[13.5px] text-muted-foreground">{s.sentBody}</p>
        </Appear>
      ) : (
        <form action={action}>
          <Field label={s.email}>
            <Input name="email" type="email" required autoComplete="email" autoFocus />
          </Field>
          <SubmitButton label={s.submit} pendingLabel={s.submitting} className="w-full" />
        </form>
      )}
      <p className="mt-5 text-center text-[13px]">
        <Link href="/login" className="font-semibold text-primary">
          {s.back}
        </Link>
      </p>
    </>
  )
}
