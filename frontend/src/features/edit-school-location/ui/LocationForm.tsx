'use client'

import { useActionState, useMemo, useState } from 'react'
import { COUNTRIES, countryName } from '@/shared/config/countries'
import { cn } from '@/shared/lib/cn'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useLocale, useT } from '@/shared/i18n'
import { saveLocationAction, type LocationState } from '../server/actions'

const idle: LocationState = { status: 'idle' }

/** Country, then city, of the school. */
export function LocationForm({ city, country }: { city: string; country: string }) {
  const t = useT()
  const s = t.school
  const [state, action] = useActionState(saveLocationAction, idle)
  return (
    <form action={action} className="flex flex-col">
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label={s.country}>
          <CountryPicker name="country" defaultValue={country} />
        </Field>
        <Field label={s.city}>
          <Input name="city" defaultValue={city} maxLength={120} placeholder={s.cityPh} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label={s.save} pendingLabel={t.schoolPage.editor.saving} />
        {state.status === 'saved' && <span className="text-sm text-success">{s.saved}</span>}
        {state.status === 'error' && <span className="text-sm text-destructive">{t.schoolPage.editor.failed}</span>}
      </div>
    </form>
  )
}

/** A searchable country list (names in the UI language); the code goes in a hidden field. */
function CountryPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const t = useT()
  const s = t.school
  const locale = useLocale()
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rows = useMemo(
    () => COUNTRIES.map((code) => ({ code, name: countryName(code, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale)),
    [locale],
  )
  const q = query.trim().toLowerCase()
  const shown = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase() === q) : rows
  const choose = (code: string) => {
    setValue(code)
    setOpen(false)
    setQuery('')
  }
  return (
    <Popover open={open} onOpenChange={(o) => (setOpen(o), o || setQuery(''))}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-start text-sm shadow-xs transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
            !value && 'text-muted-foreground',
          )}
        >
          <span className="flex-1 truncate">{value ? countryName(value, locale) : s.countryPick}</span>
          <Icon name="down" className="size-3.5 flex-none text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <input type="hidden" name={name} value={value} />
      <PopoverContent align="start" className="w-72 p-1">
        <div className="flex items-center gap-2 border-b px-2 pb-1.5">
          <Icon name="search" className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.countrySearch}
            aria-label={s.countrySearch}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (shown[0]) choose(shown[0].code)
              }
            }}
          />
        </div>
        <div role="listbox" aria-label={s.country} className="max-h-64 overflow-y-auto py-1">
          {shown.length === 0 && <p className="px-2 py-3 text-center text-sm text-muted-foreground">{t.currencyNone}</p>}
          {shown.map((r) => (
            <button
              key={r.code}
              type="button"
              role="option"
              aria-selected={r.code === value}
              onClick={() => choose(r.code)}
              className={cn(
                'flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-start text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted',
                r.code === value && 'bg-primary/5',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              {r.code === value && <Icon name="tick" className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
