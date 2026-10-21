'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Alert } from '@/shared/ui/alert'
import { buttonVariants } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Icon, IconName } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { NativeSelect as Select, NativeSelectOption } from '@/shared/ui/native-select'
import { PasswordInput } from '@/shared/ui/password-input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Appear } from '@/shared/ui/motion'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { signUp } from '../server/actions'
import { ACCOUNT_KINDS, AccountKind, initialSignUpState } from '../model/types'

/** Countries offered first; names come from the browser's locale data. */
const COUNTRIES = ['RU', 'BY', 'KZ', 'UZ', 'KG', 'TJ', 'AZ', 'AM', 'AE', 'SA', 'EG', 'JO', 'IQ', 'SY', 'LB', 'TR', 'US', 'GB', 'DE']
const countryName = new Intl.DisplayNames(['en'], { type: 'region' })
const KIND_ICON: Record<AccountKind, IconName> = { school: 'layers', teacher: 'board', student: 'book' }

function Section({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 mt-1 text-[11px] font-bold uppercase tracking-[.1em] text-primary">{children}</div>
}

/** One sign-up for schools, independent teachers and students (server action → IOMAD). */
export function SignUpForm() {
  const t = useT()
  const [kind, setKind] = useState<AccountKind>('school')
  const [state, action] = useActionState(signUp, initialSignUpState)

  if (state.status === 'success') {
    return (
      <Appear>
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-success text-primary-foreground">
          <Icon name="tick" className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <h2 className="text-lg font-bold">{t.signUp.checkEmail}</h2>
        <p className="mt-2 text-[13.5px] text-muted-foreground">{t.signUp.checkEmailBody(state.email)}</p>
        <Link href="/login" className={buttonVariants({ className: 'mt-5 w-full' })}>
          {t.signUp.signIn}
        </Link>
      </Appear>
    )
  }

  return (
    <>
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <Section>{t.signUp.kindLabel}</Section>
        <div role="radiogroup" className="mb-5 grid gap-2 sm:grid-cols-3">
          {ACCOUNT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                'relative isolate flex flex-col gap-1.5 rounded-xl border p-3 text-start transition-colors',
                kind === k ? 'border-primary' : 'border-border hover:border-input',
              )}
            >
              {kind === k && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0 -z-10 rounded-xl bg-primary/10"
                />
              )}
              <Icon name={KIND_ICON[k]} className={cn('h-5 w-5', kind === k ? 'text-primary' : 'text-muted-foreground')} />
              <b className="text-[13px]">{t.signUp.kinds[k].title}</b>
              <span className="text-[11.5px] leading-snug text-muted-foreground">{t.signUp.kinds[k].desc}</span>
            </button>
          ))}
        </div>

        {kind === 'school' && (
          <>
            <Section>{t.signUp.schoolSection}</Section>
            <Field label={t.signUp.schoolName}>
              <Input name="schoolName" required maxLength={100} />
            </Field>
          </>
        )}

        <Section>{t.signUp.accountSection}</Section>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.signUp.firstName}>
            <Input name="firstName" required autoComplete="given-name" />
          </Field>
          <Field label={t.signUp.lastName}>
            <Input name="lastName" required autoComplete="family-name" />
          </Field>
        </div>
        {kind !== 'student' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.signUp.city}>
              <Input name="city" required />
            </Field>
            <Field label={t.signUp.country}>
              <Select name="country" required defaultValue="RU" className="w-full">
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {countryName.of(c)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <Field label={t.signUp.email}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label={t.signUp.password} hint={t.signUp.passwordHint}>
          <PasswordInput name="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label={t.signUp.confirmPassword}>
          <PasswordInput name="confirmPassword" required minLength={8} autoComplete="new-password" />
        </Field>

        {state.status === 'error' && (
          <Appear>
            <Alert variant="destructive">{t.signUp.errors[state.error]}</Alert>
          </Appear>
        )}
        <SubmitButton label={t.signUp.submit} pendingLabel={t.signUp.submitting} className="w-full" />
      </form>
      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        {t.signUp.haveAccount}{' '}
        <Link href="/login" className="font-semibold text-primary">
          {t.signUp.signIn}
        </Link>
      </p>
    </>
  )
}
