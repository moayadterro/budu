'use client'

import Link from 'next/link'
import { useT } from '@/shared/i18n'
import { Button } from './button'
import { Icon } from './icon'

/**
 * Page through a long list: "21–40 of 100" and ‹ › buttons (mirrored in RTL). Hidden when
 * everything fits on one page. `page` is 0-based. Either `onPage` (the list is in the browser) or
 * `href` (the server pages it: links to `href` + `page=N`, so a page can be bookmarked).
 */
export function Pager({
  page,
  pageSize,
  total,
  onPage,
  href,
}: {
  page: number
  pageSize: number
  total: number
  onPage?: (page: number) => void
  href?: string
}) {
  const t = useT()
  if (total <= pageSize) return null
  const last = Math.ceil(total / pageSize) - 1
  const from = page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  const link = (p: number) => `${href}${href?.includes('?') ? '&' : '?'}page=${p + 1}`
  const step = (p: number, label: string, icon: 'back' | 'chevRight', disabled: boolean) =>
    href && !disabled ? (
      <Button variant="ghost" size="icon" className="size-9" asChild>
        <Link href={link(p)} aria-label={label} title={label}>
          <Icon name={icon} className="size-4 rtl:rotate-180" />
        </Link>
      </Button>
    ) : (
      <Button type="button" variant="ghost" size="icon" className="size-9" disabled={disabled} onClick={() => onPage?.(p)} aria-label={label} title={label}>
        <Icon name={icon} className="size-4 rtl:rotate-180" />
      </Button>
    )
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-xs text-muted-foreground tabular-nums">{t.pager.range(from, to, total)}</span>
      <div className="flex items-center gap-1">
        {step(page - 1, t.pager.prev, 'back', page <= 0)}
        {step(page + 1, t.pager.next, 'chevRight', page >= last)}
      </div>
    </div>
  )
}
