import { convert, formatMoney, roundUpPrice, type Rates } from '@/shared/lib/money'

export type ShownPrice = {
  free: boolean
  /** in the viewer's currency (converted ones rounded up: "1 240 ₽") */
  shown: string
  /** the teacher's price when it was converted ("15 $"), else null */
  original: string | null
}

/** A course price as this viewer sees it: converted to their currency and rounded up (owner: no "≈"). */
export function showPrice(price: number, currency: string, viewer: string, rates: Rates, locale: string): ShownPrice {
  if (price <= 0) return { free: true, shown: '', original: null }
  const original = formatMoney(price, currency, locale)
  if (viewer === currency) return { free: false, shown: original, original: null }
  const converted = convert(price, currency, viewer, rates)
  if (converted === null) return { free: false, shown: original, original: null }
  return { free: false, shown: formatMoney(roundUpPrice(converted), viewer, locale), original }
}

/** Rubles to transfer for a price — the same rounded-up figure a RUB viewer sees; null if no rate. */
export function rublesFor(price: number, currency: string, rates: Rates): number | null {
  const rub = convert(price, currency, 'RUB', rates)
  return rub === null ? null : currency === 'RUB' ? Math.ceil(rub) : roundUpPrice(rub)
}
