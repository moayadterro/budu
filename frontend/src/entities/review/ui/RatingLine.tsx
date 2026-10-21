'use client'

import { useLocale, useT } from '@/shared/i18n'
import type { Rating } from '../model/types'
import { Stars } from './Stars'

/** "★★★★★ 4.8 (12)" for a course card; "5.0 · New" when nobody has reviewed it yet. */
export function RatingLine({ rating, className }: { rating: Rating; className?: string }) {
  const t = useT()
  const locale = useLocale()
  const avg = rating.average.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (
    <span className={className} title={rating.count ? t.reviews.summary(avg, rating.count) : t.reviews.none}>
      <span className="inline-flex items-center gap-1.5 text-sm">
        <Stars value={rating.average} className="text-sm" />
        <span className="font-semibold tabular-nums">{avg}</span>
        <span className="text-muted-foreground tabular-nums">{rating.count ? `(${rating.count})` : `· ${t.reviews.new}`}</span>
      </span>
    </span>
  )
}
