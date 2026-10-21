'use client'

import { useActionState } from 'react'
import { currencyName } from '@/shared/lib/money'
import { Alert } from '@/shared/ui/alert'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useLocale, useT } from '@/shared/i18n'
import { saveRatesAction, type RatesState } from '../server/actions'

const idle: RatesState = { status: 'idle' }
type Row = { currency: string; auto: number | null; override: number | null }

/** Table of currencies: the automatic rate (per 1 USD) and an optional own rate that wins. */
export function RatesForm({ rows }: { rows: Row[] }) {
  const t = useT()
  const locale = useLocale()
  const s = t.rates
  const [state, action] = useActionState(saveRatesAction, idle)
  const num = (n: number) => new Intl.NumberFormat(locale, { maximumSignificantDigits: 6 }).format(n)
  return (
    <form action={action}>
      {state.status === 'saved' && (
        <Alert key={state.at} variant="success" className="mb-4">
          {s.saved}
        </Alert>
      )}
      {state.status === 'error' && (
        <Alert key={state.at} variant="destructive" className="mb-4">
          {s.invalid}
        </Alert>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-start text-xs text-muted-foreground">
              <th className="py-2 pe-3 text-start font-medium">{s.currency}</th>
              <th className="py-2 pe-3 text-end font-medium">{s.auto}</th>
              <th className="py-2 text-end font-medium">{s.override}</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => r.currency !== 'USD')
              .map((r) => (
                <tr key={r.currency} className="border-b last:border-0">
                  <td className="py-2 pe-3">
                    <span className="font-medium">{r.currency}</span>{' '}
                    <span className="text-muted-foreground">{currencyName(r.currency, locale)}</span>
                  </td>
                  <td className="py-2 pe-3 text-end tabular-nums text-muted-foreground">{r.auto === null ? '—' : num(r.auto)}</td>
                  <td className="py-2 text-end">
                    <Input
                      name={`rate_${r.currency}`}
                      inputMode="decimal"
                      defaultValue={r.override ?? ''}
                      placeholder={r.auto === null ? '' : num(r.auto)}
                      aria-label={`${s.override} ${r.currency}`}
                      className="ms-auto h-8 w-32 text-end tabular-nums"
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="my-3 text-xs text-muted-foreground">{s.hint}</p>
      <SubmitButton label={s.save} pendingLabel={s.save} />
    </form>
  )
}
