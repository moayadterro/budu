'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
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
  return state.status === 'sent' ? (
    // sent: what happens next, and a clear way back (the arrow above does the same)
    <Appear className="flex flex-col items-start gap-3">
      <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
        <Icon name="send" className="size-5.5 rtl:-scale-x-100" />
      </span>
      <h2 className="text-lg font-semibold">{s.sentTitle}</h2>
      <p className="text-sm text-muted-foreground">{s.sentBody}</p>
      <Button variant="outline" size="lg" className="mt-2 w-full" asChild>
        <Link href="/login">{s.back}</Link>
      </Button>
    </Appear>
  ) : (
    <form action={action}>
      <Field label={s.email}>
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </Field>
      <SubmitButton label={s.submit} pendingLabel={s.submitting} size="lg" className="w-full" />
    </form>
  )
}
