'use client'

import { useTransition } from 'react'
import { LANGUAGES, isLocale, useLocale, useT } from '@/shared/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { secondaryName } from '../lib/languageLabel'
import { setLanguage } from '../server/actions'

/** Language dropdown (Settings). Lists every language in the registry, so it scales to many. */
export function LanguagePicker() {
  const t = useT()
  const locale = useLocale()
  const [pending, start] = useTransition()
  return (
    <Select
      value={locale}
      disabled={pending}
      onValueChange={(code) => isLocale(code) && start(() => setLanguage(code))}
    >
      <SelectTrigger className="w-full sm:w-72" aria-label={t.account.language}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => {
          const other = secondaryName(l.code, locale)
          return (
            <SelectItem key={l.code} value={l.code}>
              <span lang={l.code}>{l.name}</span>
              {other && <span className="text-muted-foreground">· {other}</span>}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
