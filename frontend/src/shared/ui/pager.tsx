'use client'

import { useT } from '@/shared/i18n'
import { Button } from './button'
import { Icon } from './icon'

/**
 * Page through a long list: "21–40 of 100" and ‹ › buttons (mirrored in RTL). Hidden when
 * everything fits on one page. `page` is 0-based.
 */
export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const t = useT()
  if (total <= pageSize) return null
  const last = Math.ceil(total / pageSize) - 1
  const from = page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-xs text-muted-foreground tabular-nums">{t.pager.range(from, to, total)}</span>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" className="size-9" disabled={page <= 0} onClick={() => onPage(page - 1)} aria-label={t.pager.prev} title={t.pager.prev}>
          <Icon name="back" className="size-4 rtl:rotate-180" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-9" disabled={page >= last} onClick={() => onPage(page + 1)} aria-label={t.pager.next} title={t.pager.next}>
          <Icon name="chevRight" className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}
