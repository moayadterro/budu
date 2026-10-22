'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { localeHref, useLocale } from '@/shared/i18n'

/**
 * next/link that stays in the page's language: on /ru/… a link to "/pricing" goes to "/ru/pricing"
 * (public pages only; "/login", "/explore" … are left as they are). Use it on public pages.
 */
export function LocalLink({ href, ...props }: ComponentProps<typeof Link>) {
  const locale = useLocale()
  return <Link href={typeof href === 'string' ? localeHref(href, locale) : href} {...props} />
}
