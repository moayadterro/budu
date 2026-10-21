'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { CURRENCIES, isCurrency, type Currency } from '@/shared/config/currency'
import { currencyName } from '@/shared/lib/money'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { useLocale, useT } from '@/shared/i18n'
import { setCurrencyAction } from '../server/actions'

/** Settings: the currency prices are shown in (saved at once). */
export function CurrencyPicker({ value, compact = false }: { value: Currency; compact?: boolean }) {
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
  return (
    <NativeSelect
      value={current}
      disabled={pending}
      aria-label={t.account.currency}
      className={compact ? 'w-auto' : 'w-full max-w-xs'}
      size={compact ? 'sm' : 'default'}
      onChange={(e) => {
        const c = e.target.value as Currency
        setCurrent(c)
        start(() => setCurrencyAction(c))
      }}
    >
      {CURRENCIES.map((c) => (
        <NativeSelectOption key={c} value={c}>
          {compact ? c : `${c} — ${currencyName(c, locale)}`}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
