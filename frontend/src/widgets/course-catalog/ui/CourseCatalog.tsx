'use client'

import { useState } from 'react'
import { CourseCard } from '@/entities/course'
import { CourseActions } from '@/features/request-course'
import { CATALOG } from '@/shared/mock'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

type Filter = 'all' | 'live' | 'self' | 'free'
const FILTERS: Filter[] = ['all', 'live', 'self', 'free']

const matches = (f: Filter, c: (typeof CATALOG)[number]) =>
  f === 'all' || (f === 'free' ? c.price === 0 : c.mode === f)

/** Marketplace: filter chips + course cards. */
export function CourseCatalog() {
  const t = useT()
  const [filter, setFilter] = useState<Filter>('all')
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors',
              filter === f ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {t.explore.filters[f]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(212px,1fr))]">
        {CATALOG.filter((c) => matches(filter, c)).map((c) => (
          <CourseCard key={c.title} course={c} actions={<CourseActions free={c.price === 0} />} />
        ))}
      </div>
    </>
  )
}
