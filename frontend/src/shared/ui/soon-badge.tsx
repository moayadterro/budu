import { cn } from '@/shared/lib/cn'

/**
 * "Coming soon" — a small amber pill with a softly pulsing dot (amber = not built yet; green
 * means it exists). One look everywhere a feature is announced but not ready. The pulse only
 * runs when motion is allowed.
 */
export function SoonBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('inline-flex flex-none items-center gap-1.5 rounded-full bg-warning/12 px-2.5 py-0.5 text-xs font-semibold text-warning', className)}>
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inline-flex size-full rounded-full bg-warning opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex size-1.5 rounded-full bg-warning" />
      </span>
      {label}
    </span>
  )
}
