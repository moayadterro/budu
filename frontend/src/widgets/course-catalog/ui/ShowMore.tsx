'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { useT } from '@/shared/i18n'

/** "Show more": the same address with `show` raised to `next` (keeps the search and filters). */
export function ShowMore({ next }: { next: number }) {
  const t = useT()
  const pathname = usePathname()
  const params = new URLSearchParams(useSearchParams()?.toString())
  params.set('show', String(next))
  return (
    <div className="flex justify-center pt-2">
      <Button variant="ghost" className="h-11 rounded-xl bg-foreground/5 px-6 hover:bg-foreground/8" asChild>
        <Link href={`${pathname}?${params}`} scroll={false}>
          {t.shop.filter.showMore}
        </Link>
      </Button>
    </div>
  )
}

/** Clears search and filters (the "nothing matches" state). */
export function ResetFilters() {
  const t = useT()
  const pathname = usePathname()
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={pathname ?? '/'} scroll={false}>
        {t.shop.filter.reset}
      </Link>
    </Button>
  )
}
