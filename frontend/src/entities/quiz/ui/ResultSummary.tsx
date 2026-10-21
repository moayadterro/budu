'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/icon'
import { ProgressRing } from '@/shared/ui/progress-ring'
import { useT } from '@/shared/i18n'
import { DEFAULT_PASS, outcomeOf, outcomeTone } from '../lib/outcome'

/**
 * A result at a glance: a ring filled to the percentage in the outcome's colour (red below the pass
 * mark, green from it), the grade in the school's scale in the middle, and the outcome as an icon +
 * words (never colour alone) — with a star for excellent results. `action` = e.g. "Try again".
 */
export function ResultSummary({
  grade,
  label,
  outOf,
  passMark,
  caption,
  action,
}: {
  /** 0–100 */
  grade: number
  /** the grade in the school's scale, e.g. "3" */
  label: string
  /** "/ 5", "/ 100" … (null for letter scales) — the student sees "3 / 5", never the scale's name */
  outOf: string | null
  /** 0 = none set (then 60% is the line) */
  passMark: number
  /** e.g. "Submitted 21 Oct" */
  caption?: ReactNode
  action?: ReactNode
}) {
  const t = useT()
  const s = t.quiz.outcome
  const reduce = useReducedMotion()
  const outcome = outcomeOf(grade, passMark)
  const tone = outcomeTone[outcome]
  const pct = Math.round(grade)
  const line = passMark > 0 ? passMark : DEFAULT_PASS
  return (
    <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
      <ProgressRing value={grade} className={tone === 'success' ? 'text-success' : 'text-destructive'} label={`${s[outcome]} · ${pct}%`}>
        {/* "3/5" on one line: the grade big, its "out of" small on the same baseline */}
        <div className="flex items-baseline whitespace-nowrap leading-none" dir="ltr">
          <span className={cn('font-semibold tabular-nums', (label + (outOf ?? '')).length > 5 ? 'text-2xl' : 'text-3xl')}>{label}</span>
          {outOf && <span className="text-sm font-medium text-muted-foreground tabular-nums">{outOf.replace(/\s+/g, '')}</span>}
        </div>
      </ProgressRing>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className={cn('flex items-center justify-center gap-2 text-lg font-semibold sm:justify-start', tone === 'success' ? 'text-success' : 'text-destructive')}>
          {outcome === 'excellent' ? (
            <motion.span
              className="grid size-7 place-items-center rounded-full bg-highlight/20 text-highlight"
              initial={reduce ? false : { scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: reduce ? 0 : 0.6 }}
            >
              <Icon name="star" className="size-4" />
            </motion.span>
          ) : (
            <Icon name={outcome === 'passed' ? 'tick' : 'close'} className="size-5" />
          )}
          {s[outcome]}
        </div>
        <p className="text-sm">{outcome === 'failed' ? s.failedMsg(line) : outcome === 'excellent' ? s.excellentMsg : s.passedMsg(line)}</p>
        {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  )
}
