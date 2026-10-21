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

/**
 * A converted price rounded UP to a tidy figure: 1 239 → 1 240, 152 345 → 153 000, 15.37 → 16,
 * 0.193 → 0.2. Three significant digits from 100 up, whole units from 1, cents below.
 */
export function roundUpPrice(amount: number) {
  if (amount <= 0) return 0
  const step = amount >= 100 ? 10 ** (Math.floor(Math.log10(amount)) - 2) : amount >= 1 ? 1 : 0.01
  // tiny epsilon: 1240.0000001 must stay 1240, not become 1250
  return Math.round(Math.ceil(amount / step - 1e-9) * step * 100) / 100
}

const SHARED_SIGN = new Set(['SYP', 'EGP', 'LBP', 'JOD', 'IQD'])

/** "1 200 ₽", "$15", "١٥٠٬٠٠٠ ل.س." — in the UI language; whole units once the number is large. */
export function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // "$15", "1 240 ₽" (not "US$") — but never a sign another currency uses: the Syrian, Egyptian
    // and Lebanese pounds would all become "£"; they keep their own sign or code ("SYP", "ل.س.")
    currencyDisplay: SHARED_SIGN.has(currency) ? 'symbol' : 'narrowSymbol',
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
