'use client'

import { FormEvent, useActionState, useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { Alert } from '@/shared/ui/alert'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Icon, IconName } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { NativeSelect as Select } from '@/shared/ui/native-select'
import { PasswordInput } from '@/shared/ui/password-input'
import { PasswordStrength } from '@/shared/ui/password-strength'
import { Appear } from '@/shared/ui/motion'
import { cn } from '@/shared/lib/cn'
import { useLocale, useT } from '@/shared/i18n'
import { signUp } from '../server/actions'
import { ACCOUNT_KINDS, AccountKind, initialSignUpState } from '../model/types'

/** Countries offered first; names come from the browser's locale data. */
const COUNTRIES = ['RU', 'BY', 'KZ', 'UZ', 'KG', 'TJ', 'AZ', 'AM', 'AE', 'SA', 'EG', 'JO', 'IQ', 'SY', 'LB', 'TR', 'US', 'GB', 'DE']
const KIND_ICON: Record<AccountKind, IconName> = { student: 'book', teacher: 'board', school: 'layers' }

/**
 * One sign-up for students, teachers and schools (server action → IOMAD), on ONE step (owner). Kept
 * short: the account type is a compact segmented switch (student by default); teachers and schools
 * just add their city / country (and a school its name).
 * Submitted via a transition (not <form action>) so a server error doesn't wipe what was typed.
 */
export function SignUpForm() {
  const t = useT()
  const s = t.signUp
  const locale = useLocale()
  const reduce = useReducedMotion()
  const [kind, setKind] = useState<AccountKind>('student')
  const [pw, setPw] = useState('')
  const [state, dispatch] = useActionState(signUp, initialSignUpState)
  const [pending, start] = useTransition()
  const workspace = kind !== 'student'
  const countryName = new Intl.DisplayNames([locale], { type: 'region' })

  if (state.status === 'success') {
    return (
      <Appear className="flex flex-col items-start gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
          <Icon name="tick" className="size-6" />
        </span>
        <h2 className="text-lg font-semibold">{s.checkEmail}</h2>
        <p className="text-sm text-muted-foreground">{s.checkEmailBody(state.email)}</p>
        <Link href="/login" className={buttonVariants({ size: 'lg', className: 'mt-2 w-full' })}>
          {s.signIn}
        </Link>
      </Appear>
    )
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    start(() => dispatch(data))
  }

  return (
    <>
      <form onSubmit={submit}>
        <input type="hidden" name="kind" value={kind} />

        {/* who you are: a compact segmented switch + one line about the choice */}
        <div role="radiogroup" aria-label={s.kindLabel} className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {ACCOUNT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                'relative flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                kind === k ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {kind === k && (
                <motion.span layoutId="signup-kind" transition={{ duration: reduce ? 0 : 0.2 }} className="absolute inset-0 rounded-lg bg-background shadow-sm" />
              )}
              <Icon name={KIND_ICON[k]} className={cn('relative size-4', kind === k && 'text-primary')} />
              <span className="relative">{s.short[k]}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">{s.kinds[kind].desc}</p>

        <Field label={s.fullName} hint={s.fullNameHint}>
          <Input name="fullName" required autoComplete="name" maxLength={200} placeholder={s.fullNamePh} />
        </Field>
        <Field label={s.email}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        {/* teachers and schools: where they work (a school also its name) */}
        {kind === 'school' && (
          <Field label={s.schoolName}>
            <Input name="schoolName" required maxLength={100} />
          </Field>
        )}
        {workspace && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={s.city}>
              <Input name="city" required />
            </Field>
            <Field label={s.country}>
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
        <Field label={s.password}>
          <PasswordInput name="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <PasswordStrength value={pw} labels={s.strength} />

        {state.status === 'error' && (
          <Appear>
            <Alert variant="destructive" className="mb-4">
              {s.errors[state.error]}
            </Alert>
          </Appear>
        )}

        {/* a little air between the last field and the button */}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
          {pending ? s.submitting : s.submit}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {s.haveAccount}{' '}
        <Link href="/login" className="font-semibold text-primary">
          {s.signIn}
        </Link>
      </p>
    </>
  )
}
