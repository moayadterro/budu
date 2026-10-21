/**
 * Currencies Budu can price and show in. RUB is the platform default (prices, payments).
 * Adding one: append its ISO 4217 code; names come from Intl (in the UI language).
 */
export const CURRENCIES = ['RUB', 'USD', 'EUR', 'SYP', 'AED', 'SAR', 'EGP', 'TRY', 'KZT', 'UZS', 'BYN', 'JOD', 'IQD', 'LBP', 'GBP', 'CNY'] as const
export type Currency = (typeof CURRENCIES)[number]
export const DEFAULT_CURRENCY: Currency = 'RUB'
export const isCurrency = (v: unknown): v is Currency => typeof v === 'string' && (CURRENCIES as readonly string[]).includes(v)
