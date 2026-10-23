import { cn } from '@/shared/lib/cn'

/**
 * "Coming soon" — a small amber pill with a softly pulsing dot (amber = not built yet; green
 * means it exists). One look everywhere a feature is announced but not ready. The pulse only
 * runs when motion is allowed.
 */
export function SoonBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('inline-flex flex-none items-center gap-1 rounded-full bg-warning/12 px-2 py-px text-[0.6875rem] leading-4 font-semibold text-warning', className)}>
      <span className="relative flex size-1" aria-hidden>
        <span className="absolute inline-flex size-full rounded-full bg-warning opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex size-1 rounded-full bg-warning" />
      </span>
      {label}
    </span>
  )
}

/**
 * The "not built yet" mark in front of a coming-soon row: a filled sparkle (a big and a small
 * four-pointed star) in a one-hue amber gradient, light at the top (owner: the thin outline icon
 * looked cheap). Same amber as the badge.
 */
export function SoonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-5 flex-none', className)}>
      <defs>
        <linearGradient id="budu-soon-mark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--warning)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--warning)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#budu-soon-mark)"
        d="M10 3.5c.5 3.9 2.6 6 6.5 6.5-3.9.5-6 2.6-6.5 6.5-.5-3.9-2.6-6-6.5-6.5 3.9-.5 6-2.6 6.5-6.5Z"
      />
      <path
        fill="url(#budu-soon-mark)"
        d="M18 13.5c.28 2.17 1.33 3.22 3.5 3.5-2.17.28-3.22 1.33-3.5 3.5-.28-2.17-1.33-3.22-3.5-3.5 2.17-.28 3.22-1.33 3.5-3.5Z"
      />
    </svg>
  )
}
