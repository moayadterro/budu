'use client'

import { createContext, ReactNode, useContext } from 'react'
import { DEFAULT_LOCALE, type Locale } from './config'
import { MESSAGES, type Messages } from './messages'

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

/** Makes the request's locale available to client components (set once in the root layout). */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/** The active locale in a client component. */
export const useLocale = () => useContext(LocaleContext)

/** UI strings in the active language, for client components: `const t = useT()`. */
export const useT = (): Messages => MESSAGES[useContext(LocaleContext)]
