import { cn } from '@/shared/lib/cn'

const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z'

/** One star, filled (amber) or empty. */
export function Star({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-[1em] transition-colors', on ? 'fill-highlight' : 'fill-muted-foreground/25', className)}>
      <path d={STAR} />
    </svg>
  )
}

/** 0–5 stars, partly filled for fractions (4.6 → four and a bit). Decorative: say the number in text too. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className="relative inline-block size-[1em]">
            <svg viewBox="0 0 24 24" className="absolute inset-0 size-full fill-muted-foreground/25">
              <path d={STAR} />
            </svg>
            <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" className="size-[1em] fill-highlight">
                <path d={STAR} />
              </svg>
            </span>
          </span>
        )
      })}
    </span>
  )
}
