'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { CURRENCIES, isCurrency, type Currency } from '@/shared/config/currency'
import { currencyName } from '@/shared/lib/money'
import { Icon } from '@/shared/ui/icon'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { useLocale, useT } from '@/shared/i18n'
import { setCurrencyAction } from '../server/actions'

/** "₽ RUB", "$ USD", "SYP" — the symbol helps people recognise their money. */
function optionLabel(code: Currency, locale: string) {
  try {
    const symbol = new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value
    return symbol && symbol !== code ? `${symbol} ${code}` : code
  } catch {
    return code
  }
}

/**
 * The currency prices are shown in (saved at once). Settings: a full-width select with names.
 * `inline`: a small "💳 Prices in ₽ RUB ▾" control placed next to prices (catalog, course page).
 */
export function CurrencyPicker({ value, inline = false }: { value: Currency; inline?: boolean }) {
  const t = useT()
  const locale = useLocale()
  const [current, setCurrent] = useState(value)
  const [pending, start] = useTransition()
  const router = useRouter()
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
  const select = (
    <NativeSelect
      value={current}
      disabled={pending}
      aria-label={t.account.currency}
      className={inline ? 'w-auto' : 'w-full max-w-xs'}
      size={inline ? 'sm' : 'default'}
      onChange={(e) => {
        const c = e.target.value as Currency
        setCurrent(c)
        start(() => setCurrencyAction(c))
      }}
    >
      {CURRENCIES.map((c) => (
        <NativeSelectOption key={c} value={c}>
          {inline ? optionLabel(c, locale) : `${c} — ${currencyName(c, locale)}`}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
  if (!inline) return select
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon name="wallet" className="size-4" />
      <span>{t.pricesIn}</span>
      {select}
    </div>
  )
}
