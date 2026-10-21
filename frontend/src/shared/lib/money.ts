/** Money helpers (no business rules). Rates = units of each currency per 1 USD. */
export type Rates = Record<string, number>

/** `amount` of `from` in `to`, or null if a rate is missing. */
export function convert(amount: number, from: string, to: string, rates: Rates): number | null {
  if (from === to) return amount
  const a = rates[from]
  const b = rates[to]
  if (!a || !b) return null
  return (amount / a) * b
}

/** "1 200 ₽", "$15", "١٥٠٬٠٠٠ ل.س." — in the UI language; whole units once the number is large. */
export function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(amount) >= 100 ? 0 : 2,
  }).format(amount)
}

/** "Russian ruble" in the UI language (falls back to the code). */
export function currencyName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames(locale, { type: 'currency' }).of(code) ?? code
  } catch {
    return code
  }
}
