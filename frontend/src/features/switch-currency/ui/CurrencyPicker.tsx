'use client'

import { useState, useTransition } from 'react'
import { CURRENCIES, type Currency } from '@/shared/config/currency'
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
