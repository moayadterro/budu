'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type SegmentOption<T extends string> = { value: T; label: ReactNode; lang?: string }

/**
 * iOS-style segmented control: equal options in a tinted track, the chosen one on a raised thumb
 * that slides (Motion `layoutId`, so give each control its own `id`). Full width, 44 px tall.
 */
export function Segmented<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  id: string
  label: string
  value: T
  options: Array<SegmentOption<T>>
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex gap-1 rounded-xl bg-foreground/5 p-1', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            lang={o.lang}
            disabled={disabled}
            onClick={() => !on && onChange(o.value)}
            className={cn(
              'relative isolate flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60',
              on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {on && (
              <motion.span
                layoutId={id}
                transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.15, duration: 0.4 }}
                className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm ring-1 ring-foreground/5"
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
