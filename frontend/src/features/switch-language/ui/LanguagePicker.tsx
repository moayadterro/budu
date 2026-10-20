'use client'

import { useTransition } from 'react'
import { cn } from '@/shared/lib/cn'
import { LOCALE_NAMES, LOCALES, useLocale } from '@/shared/i18n'
import { setLanguage } from '../server/actions'

/** Three language tiles (Settings page). */
export function LanguagePicker() {
  const locale = useLocale()
  const [pending, start] = useTransition()
  return (
    <div className="grid grid-cols-3 gap-2">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          disabled={pending}
          aria-pressed={locale === code}
          onClick={() => start(() => setLanguage(code))}
          className={cn(
            'rounded-lg border p-3 text-sm font-medium transition-colors disabled:opacity-60',
            locale === code ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {LOCALE_NAMES[code]}
        </button>
      ))}
    </div>
  )
}
