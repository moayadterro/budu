'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { LocalLink as Link } from '@/shared/ui/local-link'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'

type Chip = { key: 'schedule' | 'exams' | 'grades' | 'chat'; label: string }

/** The floating glass chips: one hue per icon tile, a place around the headline, its own float rhythm. */
const CHIP_STYLE: Record<Chip['key'], { icon: IconName; tile: string; place: string; delay: string }> = {
  schedule: { icon: 'cal', tile: 'from-info/70 to-info', place: 'start-[7%] top-[24%]', delay: '0s' },
  exams: { icon: 'task', tile: 'from-subject-purple/70 to-subject-purple', place: 'end-[7%] top-[20%]', delay: '-2s' },
  grades: { icon: 'report', tile: 'from-primary/70 to-primary dark:from-success/70 dark:to-success', place: 'start-[10%] bottom-[26%]', delay: '-4s' },
  chat: { icon: 'chat', tile: 'from-glow-rose/80 to-glow-rose', place: 'end-[9%] bottom-[30%]', delay: '-1s' },
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The home page's first screen (owner: "it must look like it came from the future, wow"):
 * - a full-width living aurora: four huge soft blurs (green, blue, purple, rose; each ONE hue)
 *   wandering on their own paths while the whole field slowly shifts its colours (holographic);
 * - a perspective grid floor gliding toward the viewer, fading into the horizon;
 * - the headline appearing word by word out of a blur, then the line and the buttons;
 * - a soft light following the pointer (desktop);
 * - frosted-glass chips with what Budu does, floating around the headline (desktop).
 * It runs edge to edge under the transparent header. Everything is still for reduced motion.
 */
export function HomeHero({
  badge,
  title,
  sub,
  start,
  browse,
  chips,
}: {
  badge: string
  title: string
  sub: string
  start: string
  browse: string
  chips: Chip[]
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const words = title.split(' ')

  // the pointer light: CSS variables only, no re-render
  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--hx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--hy', `${e.clientY - r.top}px`)
  }

  return (
    <section
      ref={ref}
      onPointerMove={onMove}
      // full width (out of the page column) and under the floating header
      className="relative isolate left-1/2 -mt-[6.25rem] flex min-h-[min(54rem,94svh)] w-screen -translate-x-1/2 flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-24 text-center sm:-mt-[7.25rem] sm:pt-36"
    >
      {/* the aurora: each blur one hue, wandering; the whole field drifts in colour */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 motion-safe:animate-hue-drift">
        <div className="absolute start-[-6%] top-[4%] size-[38rem] max-w-[70vw] rounded-full bg-primary/34 blur-[110px] motion-safe:animate-wander-1 dark:bg-primary/32" />
        <div className="absolute end-[-8%] top-[10%] size-[34rem] max-w-[65vw] rounded-full bg-info/32 blur-[110px] motion-safe:animate-wander-2 dark:bg-info/32" />
        <div className="absolute start-[28%] bottom-[0%] size-[32rem] max-w-[60vw] rounded-full bg-subject-purple/26 blur-[120px] motion-safe:animate-wander-3 dark:bg-subject-purple/28" />
        <div className="absolute end-[18%] bottom-[14%] size-[22rem] max-w-[45vw] rounded-full bg-glow-rose/30 blur-[100px] motion-safe:animate-aurora dark:bg-glow-rose/22" />
      </div>

      {/* the pointer light (desktop mouse only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 hidden [background:radial-gradient(520px_circle_at_var(--hx,50%)_var(--hy,40%),color-mix(in_oklch,var(--background)_55%,transparent),transparent_70%)] md:block dark:[background:radial-gradient(520px_circle_at_var(--hx,50%)_var(--hy,40%),color-mix(in_oklch,var(--foreground)_7%,transparent),transparent_70%)]"
      />

      {/* the horizon: a perspective grid floor gliding toward the viewer, fading into the distance */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[42%] [perspective:520px]">
        <div className="absolute inset-x-[-50%] bottom-0 h-[160%] origin-bottom [transform:rotateX(62deg)] [mask-image:linear-gradient(to_top,#000_25%,transparent_85%)] [background-image:linear-gradient(color-mix(in_oklch,var(--foreground)_14%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_14%,transparent)_1px,transparent_1px)] [background-size:64px_64px] motion-safe:animate-grid-glide" />
      </div>

      {/* a soft fade into the page below, so the hero has no edge */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 bg-linear-to-b from-transparent to-background" />

      {/* what Budu does, floating in frosted glass around the headline (desktop) */}
      {chips.map((c, i) => {
        const st = CHIP_STYLE[c.key]
        return (
          <motion.div
            key={c.key}
            aria-hidden
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.9 + i * 0.12, duration: 0.6, ease: EASE }}
            className={cn('absolute hidden lg:block', st.place)}
          >
            <div
              className="flex items-center gap-2.5 rounded-2xl bg-background/60 py-2 ps-2 pe-4 text-sm font-medium shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_12px_32px_-12px_color-mix(in_oklch,var(--foreground)_20%,transparent)] ring-1 ring-foreground/6 backdrop-blur-xl backdrop-saturate-150 motion-safe:animate-float dark:bg-foreground/8 dark:shadow-none"
              style={{ animationDelay: st.delay }}
            >
              <span className={cn('grid size-8 place-items-center rounded-xl bg-linear-to-b text-primary-foreground', st.tile)}>
                <Icon name={st.icon} className="size-4" />
              </span>
              {c.label}
            </div>
          </motion.div>
        )
      })}

      <div className="flex max-w-4xl flex-col items-center gap-7">
        <motion.span
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full bg-background/50 px-3.5 py-1.5 text-xs font-medium text-foreground/80 ring-1 ring-foreground/8 backdrop-blur-xl dark:bg-foreground/6"
        >
          <span className="relative flex size-1.5" aria-hidden>
            <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 motion-safe:animate-ping dark:bg-success" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary dark:bg-success" />
          </span>
          {badge}
        </motion.span>

        {/* the headline, word by word out of a blur */}
        <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: reduce ? 0 : 0.15 + i * 0.07, duration: 0.7, ease: EASE }}
            >
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.35 + words.length * 0.07, duration: 0.6, ease: EASE }}
          className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl"
        >
          {sub}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.5 + words.length * 0.07, duration: 0.6, ease: EASE }}
          className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
        >
          <Button size="lg" className="group h-12 w-full gap-2 rounded-xl px-7 text-base sm:w-auto" asChild>
            <Link href="/register">
              {start}
              <Icon name="forward" className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full rounded-xl bg-background/50 px-7 text-base ring-1 ring-foreground/8 backdrop-blur-xl hover:bg-background/70 sm:w-auto dark:bg-foreground/6 dark:hover:bg-foreground/10"
            asChild
          >
            <Link href="/catalog">{browse}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
