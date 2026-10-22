'use client'

import { useState, useTransition } from 'react'
import { Icon } from '@/shared/ui/icon'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { cn } from '@/shared/lib/cn'
import { LANGUAGES, LOCALE_NAMES, isLocale, useLocale, useT } from '@/shared/i18n'
import { secondaryName } from '../lib/languageLabel'
import { setLanguage } from '../server/actions'

/**
 * Phone language choice: a full-width row with the current language that opens a bottom sheet
 * listing every language (own name + name in the UI language, ✓ on the current one). Scrolls, so it
 * works for any number of languages.
 */
export function LanguageSheet() {
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  const choose = (code: string) => {
    setOpen(false)
    if (code !== locale && isLocale(code)) start(() => setLanguage(code))
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className="flex h-12 w-full items-center gap-2 rounded-xl bg-foreground/5 px-3 text-start text-sm font-medium transition-colors hover:bg-foreground/8 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          <Icon name="globe" className="size-4 flex-none text-muted-foreground" />
          <span lang={locale} className="flex-1 truncate">
            {LOCALE_NAMES[locale]}
          </span>
          <Icon name="chevRight" className="size-4 flex-none opacity-50 rtl:rotate-180" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[80svh] gap-0 rounded-t-3xl px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <span aria-hidden className="mx-auto mb-3 h-1 w-10 flex-none rounded-full bg-foreground/15" />
        <SheetTitle className="px-3 pb-1 text-base">{t.account.language}</SheetTitle>
        <SheetDescription className="px-3 pb-3 text-xs">{t.account.languageHint}</SheetDescription>
        <ul className="-mx-1 flex flex-col gap-0.5 overflow-y-auto px-1">
          {LANGUAGES.map((l) => {
            const on = l.code === locale
            const other = secondaryName(l.code, locale)
            return (
              <li key={l.code}>
                <button
                  type="button"
                  aria-current={on ? 'true' : undefined}
                  onClick={() => choose(l.code)}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition-colors',
                    on ? 'bg-primary/8' : 'hover:bg-foreground/5',
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span lang={l.code} className="truncate text-base font-medium">
                      {l.name}
                    </span>
                    {other && <span className="truncate text-xs text-muted-foreground">{other}</span>}
                  </span>
                  {on && <Icon name="tick" className="size-5 flex-none text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
