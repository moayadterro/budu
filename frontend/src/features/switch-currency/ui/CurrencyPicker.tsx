'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { CURRENCIES, isCurrency, type Currency } from '@/shared/config/currency'
import { cn } from '@/shared/lib/cn'
import { currencyName } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { useLocale, useT } from '@/shared/i18n'
import { setCurrencyAction } from '../server/actions'

/**
 * The currency prices are shown in (saved at once): a button like the app's other controls that
 * opens a searchable list — code and name (owner: just "USD", no symbols here; prices themselves
 * carry the symbol). `inline`: the small "Prices in RUB" control next to prices (catalog, course
 * page); otherwise a full-width field (Settings).
 */
export function CurrencyPicker({ value, inline = false }: { value: Currency; inline?: boolean }) {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [current, setCurrent] = useState(value)
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // follow the server's value when it changes (sign-in, refresh …), or the picker and the prices disagree
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    setCurrent(value)
  }
  // changed in another tab? The browser cookie mirrors the choice (also for signed-in users), and
  // clicking around doesn't re-render this header — so when the cookie changes (or this tab comes
  // back into view and it changed meanwhile), show it and re-render the prices.
  const lastCookie = useRef<string | null>(null)
  useEffect(() => {
    const read = () => document.cookie.match(/(?:^|; )budu_currency=([^;]+)/)?.[1] ?? null
    lastCookie.current = read()
    const sync = () => {
      const c = read()
      if (c === lastCookie.current || !isCurrency(c)) return
      lastCookie.current = c
      setCurrent(c)
      router.refresh()
    }
    const store = (window as { cookieStore?: EventTarget }).cookieStore // Chrome, Safari 18.4+
    store?.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    return () => {
      store?.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [router])

  const rows = useMemo(() => CURRENCIES.map((code) => ({ code, name: currencyName(code, locale) })), [locale])
  const q = query.trim().toLowerCase()
  const found = q ? rows.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)) : null

  const choose = (c: Currency) => {
    setOpen(false)
    setQuery('')
    if (c === current) return
    setCurrent(c)
    start(() => setCurrencyAction(c))
  }

  const row = (r: { code: Currency; name: string }) => (
    <button
      key={r.code}
      type="button"
      role="option"
      aria-selected={r.code === current}
      onClick={() => choose(r.code)}
      className={cn(
        'flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-start text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted',
        r.code === current && 'bg-primary/5',
      )}
    >
      <span className="w-10 flex-none font-semibold tabular-nums">{r.code}</span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.name}</span>
      {r.code === current && <Icon name="tick" className="size-4 text-primary" />}
    </button>
  )

  return (
    <Popover open={open} onOpenChange={(o) => (setOpen(o), o || setQuery(''))}>
      <div className={cn('flex items-center gap-2', !inline && 'w-full max-w-xs')}>
        {inline && <span className="text-sm text-muted-foreground">{t.pricesIn}</span>}
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={inline ? 'sm' : 'default'}
            disabled={pending}
            aria-label={`${t.account.currency}: ${currencyName(current, locale)}`}
            className={cn('group', !inline && 'w-full justify-between font-normal')}
          >
            <span className={cn('tabular-nums', !inline && 'flex-1 truncate text-start')}>
              {inline ? current : `${currencyName(current, locale)} · ${current}`}
            </span>
            <Icon name="down" className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="end" className="w-64 p-1">
        <div className="flex items-center gap-2 border-b px-2 pb-1.5">
          <Icon name="search" className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.currencySearch}
            aria-label={t.currencySearch}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && found?.length) choose(found[0].code)
            }}
          />
        </div>
        <div role="listbox" aria-label={t.account.currency} className="mt-1 max-h-80 overflow-y-auto">
          {found ? (
            found.length ? (
              found.map(row)
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t.currencyNone}</p>
            )
          ) : (
            rows.map(row)
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
