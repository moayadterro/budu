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
import { PasswordMatch, PasswordStrength } from '@/shared/ui/password-strength'
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
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
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
                // phones: compact rows (icon · title + text); from sm up: three cards side by side
                'relative isolate grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5 rounded-xl border p-3 text-start transition-all sm:flex sm:flex-col sm:items-start sm:gap-1.5',
                kind === k ? 'border-primary shadow-sm' : 'border-border hover:border-input hover:bg-muted/40',
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
              <span
                className={cn(
                  'row-span-2 grid size-9 place-items-center rounded-lg transition-colors',
                  kind === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon name={KIND_ICON[k]} className="size-4.5" />
              </span>
              <b className="text-sm">{t.signUp.kinds[k].title}</b>
              <span className="text-xs leading-snug text-muted-foreground">{t.signUp.kinds[k].desc}</span>
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
        <Field label={t.signUp.password}>
          <PasswordInput name="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
      <PasswordStrength value={pw} labels={t.signUp.strength} />
        <Field label={t.signUp.confirmPassword}>
          <PasswordInput name="confirmPassword" required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
      <PasswordMatch password={pw} confirm={pw2} labels={t.signUp} />

        {state.status === 'error' && (
          <Appear>
            <Alert variant="destructive">{t.signUp.errors[state.error]}</Alert>
          </Appear>
        )}
        <SubmitButton label={t.signUp.submit} pendingLabel={t.signUp.submitting} size="lg" className="w-full" />
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
