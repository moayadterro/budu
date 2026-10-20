'use client'

import { useTransition } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { LanguageSkillIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { LOCALE_NAMES, LOCALES, useLocale, useT } from '@/shared/i18n'
import { setLanguage } from '../server/actions'

/** Globe button with the three languages (header and sign-in pages). */
export function LanguageMenu() {
  const t = useT()
  const locale = useLocale()
  const [pending, start] = useTransition()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.account.language} disabled={pending}>
          <HugeiconsIcon icon={LanguageSkillIcon} strokeWidth={1.8} className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LOCALES.map((code) => (
          <DropdownMenuItem key={code} lang={code} onSelect={() => start(() => setLanguage(code))}>
            {LOCALE_NAMES[code]}
            {code === locale && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ms-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
