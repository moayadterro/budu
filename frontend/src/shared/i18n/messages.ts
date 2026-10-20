import { ar } from './ar'
import { en } from './en'
import { ru } from './ru'
import type { Locale } from './config'

/** The shape every dictionary must match (English is the reference). */
export type Messages = typeof en

export const MESSAGES: Record<Locale, Messages> = { en, ru, ar }
