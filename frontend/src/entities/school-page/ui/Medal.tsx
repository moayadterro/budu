import { cn } from '@/shared/lib/cn'

const TONE = ['bg-gold', 'bg-silver', 'bg-bronze']

/** A plain round medal with the place number (1 gold, 2 silver, 3 bronze) — no ribbon. */
export function Medal({ place, className }: { place: number; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-8 place-items-center rounded-full text-sm font-bold text-medal-foreground tabular-nums shadow-sm ring-2 ring-background',
        TONE[place - 1],
        className,
      )}
    >
      {place}
    </span>
  )
}
