'use client'

import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { isLocale, isLocalizedPath, localePath, splitLocale } from '@/shared/i18n'
import { setLanguage } from '../server/actions'

/**
 * Switch the UI language (saved in the browser + the account). On a public page the address
 * carries the language (SEO), so it also opens that page in the new language: /pricing → /ru/pricing.
 */
export function useSwitchLanguage() {
  const pathname = usePathname() ?? '/'
  const [pending, start] = useTransition()
  const choose = (code: string) => {
    if (!isLocale(code)) return
    start(async () => {
      await setLanguage(code)
      const { path } = splitLocale(pathname)
      // a full load: the page shell (<html lang dir>, the strings provider) is not re-rendered by
      // client navigation, so a soft move would keep the old language
      if (isLocalizedPath(path)) window.location.assign(localePath(path, code) + window.location.search + window.location.hash)
    })
  }
  return { pending, choose }
}
