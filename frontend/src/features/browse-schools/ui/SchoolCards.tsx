'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { BrandImage } from '@/shared/ui/brand-image'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { moreSchoolsAction } from '../server/actions'

type School = { name: string; city: string; slug: string; logoId: number | null; coverId: number | null }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/**
 * School cards, a page at a time: the next page loads when the end of the list scrolls into view
 * (and with "Show more" — keyboards and old browsers). Skeleton cards while loading.
 */
export function SchoolCards({ initial, next: firstNext }: { initial: School[]; next: string | null }) {
  const t = useT()
  const [items, setItems] = useState(initial)
  const [next, setNext] = useState(firstNext)
  const [pending, start] = useTransition()
  const sentinel = useRef<HTMLDivElement>(null)

  const loadMore = () => {
    if (!next || pending) return
    start(async () => {
      const r = await moreSchoolsAction(next)
      setItems((cur) => [...cur, ...r.items.filter((x) => !cur.some((c) => c.slug === x.slug))])
      setNext(r.next)
    })
  }

  // infinite scroll: fetch when the end of the list comes near
  useEffect(() => {
    const el = sentinel.current
    if (!el || !next) return
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && loadMore(), { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  })

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x) => (
          <li key={x.slug}>
            <Link
              href={`/schools/${x.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {/* the school's cover photo — or a calm brand strip with its logo */}
              <div className="relative aspect-[16/9] overflow-hidden bg-brand">
                {x.coverId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/files/${x.coverId}`} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                ) : (
                  x.logoId && (
                    <div className="grid size-full place-items-center">
                      <BrandImage src={`/files/${x.logoId}`} className="size-24 rounded-2xl shadow-lg" />
                    </div>
                  )
                )}
              </div>
              <div className={cn('relative flex flex-1 flex-col gap-1 px-5 pb-5', (x.logoId && x.coverId) || !x.logoId ? 'pt-10' : 'pt-4')}>
                {/* logo / photo overlapping the strip */}
                <span className="absolute -top-8 start-5">
                  {x.logoId && x.coverId ? (
                    <BrandImage src={`/files/${x.logoId}`} className="size-16 rounded-xl border-4 border-card shadow-sm" />
                  ) : !x.logoId ? (
                    <InitialsAvatar initials={initials(x.name)} color="var(--color-primary)" className="size-16 rounded-xl border-4 border-card text-lg" />
                  ) : null}
                </span>
                <h2 className="line-clamp-2 text-lg font-semibold leading-snug">{x.name}</h2>
                {x.city && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="pin" className="size-4 flex-none" />
                    {x.city}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
        {pending &&
          [0, 1, 2].map((i) => (
            <li key={`s${i}`} aria-hidden className="overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-[16/9] animate-pulse bg-muted" />
              <div className="flex flex-col gap-2 p-5 pt-10">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </li>
          ))}
      </ul>
      {next && (
        <div ref={sentinel} className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={pending}>
            {pending ? t.site.schools.loading : t.site.schools.more}
          </Button>
        </div>
      )}
    </div>
  )
}
