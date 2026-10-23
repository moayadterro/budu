'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { languageName } from '@/shared/config/course-language'
import { isCourseSubject } from '@/shared/config/course-subject'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Icon } from '@/shared/ui/icon'
import { useLocale, useT } from '@/shared/i18n'
import type { CatalogQuery } from '../lib/filter'
import { useCatalogPending } from './CatalogPending'

type Facet = { key: string; n: number }

/**
 * Search + filters over the catalog (Airbnb / App Store style): a soft search field, then compact
 * chips (subject, language, price) that open the app's glass menus; a chosen filter shows its value,
 * tinted. Every change goes into the address (the server filters), the search after a short pause.
 * `end`: something for the end of the chip row (the currency picker).
 */
export function CatalogFilters({
  query,
  subjects,
  languages,
  prices,
  found,
  end,
}: {
  query: CatalogQuery
  subjects: Facet[]
  languages: Facet[]
  prices: { free: boolean; paid: boolean }
  found: number
  end?: React.ReactNode
}) {
  const t = useT()
  const s = t.shop.filter
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { pending, start } = useCatalogPending()
  const [text, setText] = useState(query.q)

  // the address changed elsewhere (reset, back button): show its search
  const [seen, setSeen] = useState(query.q)
  if (query.q !== seen) {
    setSeen(query.q)
    setText(query.q)
  }

  const go = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params?.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    next.delete('show') // a new search starts from the first page
    const qs = next.toString()
    start(() => router.replace(qs ? `${pathname}?${qs}` : (pathname ?? ''), { scroll: false }))
  }

  // search after a short pause in typing
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const type = (v: string) => {
    setText(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (v.trim() !== query.q) go({ q: v.trim() })
    }, 350)
  }

  const subjectName = (k: string) => (isCourseSubject(k) ? t.subjects[k] : k)
  const priceName = (p: string) => (p === 'free' ? s.free : p === 'paid' ? s.paid : s.anyPrice)
  const filtered = Boolean(query.q || query.subject || query.lang || query.price)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        {/* the magnifier turns into a spinner while the search runs */}
        <Icon
          name={pending ? 'loading' : 'search'}
          className={cn('pointer-events-none absolute start-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground', pending && 'animate-spin')}
        />
        <input
          type="search"
          value={text}
          onChange={(e) => type(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              clearTimeout(timer.current)
              go({ q: text.trim() })
            }
          }}
          placeholder={s.search}
          aria-label={s.search}
          enterKeyHint="search"
          className="h-12 w-full rounded-xl bg-foreground/5 ps-11 pe-11 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:bg-foreground/7 focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={() => (clearTimeout(timer.current), setText(''), go({ q: '' }))}
            aria-label={s.clear}
            className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
          >
            <Icon name="close" className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {subjects.length > 0 && (
          <Chip label={s.subject} value={query.subject ? subjectName(query.subject) : null}>
            <DropdownMenuRadioGroup value={query.subject} onValueChange={(v) => go({ subject: v })}>
              <DropdownMenuRadioItem value="">{s.anySubject}</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {subjects.map((f) => (
                <DropdownMenuRadioItem key={f.key} value={f.key}>
                  {subjectName(f.key)}
                  <span className="ms-auto ps-4 text-xs text-muted-foreground tabular-nums">{f.n}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </Chip>
        )}
        {languages.length > 0 && (
          <Chip label={s.language} value={query.lang ? languageName(query.lang, locale) : null}>
            <DropdownMenuRadioGroup value={query.lang} onValueChange={(v) => go({ lang: v })}>
              <DropdownMenuRadioItem value="">{s.anyLanguage}</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {languages.map((f) => (
                <DropdownMenuRadioItem key={f.key} value={f.key}>
                  {languageName(f.key, locale)}
                  <span className="ms-auto ps-4 text-xs text-muted-foreground tabular-nums">{f.n}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </Chip>
        )}
        {prices.free && prices.paid && (
          <Chip label={s.price} value={query.price ? priceName(query.price) : null}>
            <DropdownMenuRadioGroup value={query.price} onValueChange={(v) => go({ price: v })}>
              {['', 'free', 'paid'].map((p) => (
                <DropdownMenuRadioItem key={p} value={p}>
                  {priceName(p)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </Chip>
        )}
        {filtered && (
          <Button variant="link" size="sm" className="h-8 px-1.5 text-muted-foreground" onClick={() => (setText(''), go({ q: '', subject: '', lang: '', price: '' }))}>
            {s.reset}
          </Button>
        )}
        <div className="ms-auto flex items-center gap-3">
          {filtered && (
            <span className={cn('text-sm text-muted-foreground transition-opacity', pending && 'opacity-50')} aria-live="polite">
              {s.found(found)}
            </span>
          )}
          {end}
        </div>
      </div>
    </div>
  )
}

/** One filter chip (same look as the currency chip): its name, or the chosen value tinted. */
function Chip({ label, value, children }: { label: string; value: string | null; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={value ? `${label}: ${value}` : label}
          className={cn(
            'group h-8 gap-1 rounded-lg ps-2.5 pe-1.5 text-xs font-medium',
            value ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:bg-success/15 dark:text-success dark:hover:text-success' : 'bg-foreground/5 text-foreground hover:bg-foreground/8',
          )}
        >
          {value ?? label}
          <Icon name="down" className="size-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 min-w-56 overflow-y-auto">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
