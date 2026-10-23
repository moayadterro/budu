'use client'

import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/shared/lib/cn'
import { Icon, type IconName } from '@/shared/ui/icon'

export type Audience = { key: 'schools' | 'teachers' | 'students' | 'parents'; title: string; text: string }

/**
 * One hue per audience (the plan colours: schools purple, teachers blue, students green; parents the
 * warm rose of Contact). Each card: a soft one-hue tint from the corner, a big faint symbol in the
 * other corner, a gradient app icon. Never mixed hues, never a coloured glow behind a card.
 */
const STYLE: Record<Audience['key'], { icon: IconName; fade: string; tile: string; mark: string }> = {
  schools: {
    icon: 'school',
    fade: 'from-subject-purple/10 dark:from-subject-purple/12',
    tile: 'from-subject-purple/70 to-subject-purple',
    mark: 'text-subject-purple',
  },
  teachers: { icon: 'teacher', fade: 'from-info/10 dark:from-info/12', tile: 'from-info/70 to-info', mark: 'text-info' },
  students: {
    icon: 'student',
    fade: 'from-primary/10 dark:from-success/10',
    tile: 'from-primary/70 to-primary dark:from-success/70 dark:to-success',
    mark: 'text-primary dark:text-success',
  },
  parents: { icon: 'users', fade: 'from-glow-rose/14 dark:from-glow-rose/12', tile: 'from-glow-rose/80 to-glow-rose', mark: 'text-glow-rose' },
}

/**
 * "For everyone who learns and teaches" (owner: 2 × 2, modern, alive): the cards rise in one after
 * another when scrolled into view, the icons float gently, and a card lifts on hover while its icon
 * tilts. All motion is skipped when the device asks for reduced motion.
 */
export function AudienceCards({ items }: { items: Audience[] }) {
  const reduce = useReducedMotion()
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
      {items.map((a, i) => {
        const st = STYLE[a.key]
        return (
          <motion.article
            key={a.key}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: reduce ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'group relative isolate flex flex-col gap-5 overflow-hidden rounded-3xl bg-linear-to-br to-card p-7 transition-transform duration-300 motion-safe:hover:-translate-y-1 sm:p-9 rtl:bg-linear-to-bl',
              // soft NEUTRAL edge (as the plan cards); a hairline in dark mode
              'shadow-[0_3px_8px_-2px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_12px_28px_-12px_color-mix(in_oklch,var(--foreground)_8%,transparent)] dark:shadow-none dark:ring-1 dark:ring-foreground/8',
              st.fade,
            )}
          >
            {/* the audience's symbol, big and faint, in the far corner */}
            <Icon
              aria-hidden
              name={st.icon}
              className={cn('pointer-events-none absolute -end-6 -bottom-6 -z-10 size-40 opacity-[0.07] transition-transform duration-500 group-hover:-rotate-6 dark:opacity-[0.1]', st.mark)}
            />
            <span className="motion-safe:animate-float" style={{ animationDelay: `${i * -1.5}s` }}>
              <span
                className={cn(
                  'grid size-16 place-items-center rounded-[1.35rem] bg-linear-to-b text-primary-foreground transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105',
                  'shadow-[0_1px_1px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_8px_20px_-8px_color-mix(in_oklch,var(--foreground)_25%,transparent)] dark:shadow-none',
                  st.tile,
                )}
              >
                <Icon name={st.icon} className="size-8" />
              </span>
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold tracking-tight">{a.title}</h3>
              <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{a.text}</p>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
