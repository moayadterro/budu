'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { LanguageSkillIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { LANGUAGES, useLocale, useT } from '@/shared/i18n'
import { secondaryName } from '../lib/languageLabel'
import { useSwitchLanguage } from '../lib/useSwitchLanguage'

/** Globe button with a scrollable radio list of languages (header and sign-in pages). */
export function LanguageMenu() {
  const t = useT()
  const locale = useLocale()
  const { pending, choose } = useSwitchLanguage()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.account.language} disabled={pending}>
          <HugeiconsIcon icon={LanguageSkillIcon} strokeWidth={1.8} className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 min-w-48 overflow-y-auto">
        <DropdownMenuLabel>{t.account.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={choose}>
          {LANGUAGES.map((l) => {
            const other = secondaryName(l.code, locale)
            return (
              <DropdownMenuRadioItem key={l.code} value={l.code}>
                <span lang={l.code}>{l.name}</span>
                {other && <span className="ms-auto ps-3 text-xs text-muted-foreground">{other}</span>}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
