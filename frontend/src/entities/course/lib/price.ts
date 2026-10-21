import { convert, formatMoney, roundUpPrice, type Rates } from '@/shared/lib/money'

export type ShownPrice = {
  free: boolean
  /** in the viewer's currency (converted ones rounded up: "1 240 ₽") — the only price people see */
  shown: string
}

/**
 * A course price as this viewer sees it: converted to their currency and rounded up (owner: no "≈",
 * and never the teacher's own price / currency — the platform decides what people see).
 */
export function showPrice(price: number, currency: string, viewer: string, rates: Rates, locale: string): ShownPrice {
  if (price <= 0) return { free: true, shown: '' }
  if (viewer === currency) return { free: false, shown: formatMoney(price, currency, locale) }
  const converted = convert(price, currency, viewer, rates)
  // no rate for this pair: fall back to the listed price rather than show nothing
  if (converted === null) return { free: false, shown: formatMoney(price, currency, locale) }
  return { free: false, shown: formatMoney(roundUpPrice(converted), viewer, locale) }
}

/** Rubles to transfer for a price — the same rounded-up figure a RUB viewer sees; null if no rate. */
export function rublesFor(price: number, currency: string, rates: Rates): number | null {
  const rub = convert(price, currency, 'RUB', rates)
  return rub === null ? null : currency === 'RUB' ? Math.ceil(rub) : roundUpPrice(rub)
}
