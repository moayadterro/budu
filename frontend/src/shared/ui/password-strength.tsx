'use client'

import { cn } from '@/shared/lib/cn'
import { Icon } from './icon'

/** The same rules as `passwordOk` (shared/lib/password): length, upper, lower, digit. */
const RULES = [
  { key: 'length', test: (p: string) => p.length >= 8 },
  { key: 'upper', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', test: (p: string) => /[a-z]/.test(p) },
  { key: 'digit', test: (p: string) => /\d/.test(p) },
] as const

export type StrengthLabels = {
  levels: string[] // weak, fair, good, strong
  rules: Record<(typeof RULES)[number]['key'], string>
}

/**
 * Live feedback while choosing a password: a 4-step meter (weak → strong) and the rules, each ticking
 * green as it's met. Shown once the person starts typing.
 */
export function PasswordStrength({ value, labels }: { value: string; labels: StrengthLabels }) {
  if (!value) return null
  const met = RULES.filter((r) => r.test(value)).length // 0–4
  // all four rules met = strong; a long password with a symbol on top doesn't need more praise
  const level = met <= 1 ? 0 : met - 1
  const tone = ['bg-destructive', 'bg-warning', 'bg-info', 'bg-success'][level]
  return (
    <div className="-mt-2 mb-4 flex flex-col gap-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn('h-1.5 rounded-full transition-colors duration-300', i <= level ? tone : 'bg-muted')} />
          ))}
        </div>
        <span className="w-20 text-end text-xs font-medium text-muted-foreground">{labels.levels[level]}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {RULES.map((r) => {
          const ok = r.test(value)
          return (
            <li key={r.key} className={cn('flex items-center gap-1.5 transition-colors', ok ? 'text-success' : 'text-muted-foreground')}>
              <Icon name={ok ? 'tick' : 'dot'} className="size-3.5 flex-none" />
              {labels.rules[r.key]}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** "✓ Passwords match" / "Passwords don't match" under the confirmation field (once it has text). */
export function PasswordMatch({ password, confirm, labels }: { password: string; confirm: string; labels: { match: string; noMatch: string } }) {
  if (!confirm) return null
  const ok = password === confirm
  return (
    <p className={cn('-mt-2 mb-4 flex items-center gap-1.5 text-xs font-medium', ok ? 'text-success' : 'text-destructive')} aria-live="polite">
      <Icon name={ok ? 'tick' : 'close'} className="size-3.5" />
      {ok ? labels.match : labels.noMatch}
    </p>
  )
}
