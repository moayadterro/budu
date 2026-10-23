'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { LocalLink as Link } from '@/shared/ui/local-link'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'

export type FeatureKey =
  | 'schedule' | 'exams' | 'quizzes' | 'grades' | 'video' | 'homework' | 'chat' | 'parents'
  | 'classes' | 'alerts' | 'scales' | 'currency' | 'preview' | 'page' | 'uploads' | 'languages'

/** Every feature: its icon and ONE hue for its little gradient tile (all of them exist today). */
const FEATURE: Record<FeatureKey, { icon: IconName; tile: string }> = {
  schedule: { icon: 'cal', tile: 'from-info/70 to-info' },
  exams: { icon: 'task', tile: 'from-subject-purple/70 to-subject-purple' },
  quizzes: { icon: 'check', tile: 'from-glow-rose/80 to-glow-rose' },
  grades: { icon: 'report', tile: 'from-primary/70 to-primary dark:from-success/70 dark:to-success' },
  video: { icon: 'video', tile: 'from-info/70 to-info' },
  homework: { icon: 'doc', tile: 'from-subject-purple/70 to-subject-purple' },
  chat: { icon: 'chat', tile: 'from-glow-rose/80 to-glow-rose' },
  parents: { icon: 'users', tile: 'from-primary/70 to-primary dark:from-success/70 dark:to-success' },
  classes: { icon: 'layers', tile: 'from-info/70 to-info' },
  alerts: { icon: 'bell', tile: 'from-subject-purple/70 to-subject-purple' },
  scales: { icon: 'star', tile: 'from-glow-rose/80 to-glow-rose' },
  currency: { icon: 'wallet', tile: 'from-primary/70 to-primary dark:from-success/70 dark:to-success' },
  preview: { icon: 'play', tile: 'from-info/70 to-info' },
  page: { icon: 'web', tile: 'from-subject-purple/70 to-subject-purple' },
  uploads: { icon: 'upload', tile: 'from-glow-rose/80 to-glow-rose' },
  languages: { icon: 'lang', tile: 'from-primary/70 to-primary dark:from-success/70 dark:to-success' },
}

/** Six float around the headline (desktop), three per side, each with its own rhythm. */
const FLOATING: Array<{ key: FeatureKey; place: string; delay: string }> = [
  { key: 'schedule', place: 'start-[6%] top-[20%]', delay: '0s' },
  { key: 'video', place: 'start-[2%] top-[42%]', delay: '-3s' },
  { key: 'grades', place: 'start-[9%] bottom-[30%]', delay: '-4.5s' },
  { key: 'exams', place: 'end-[6%] top-[17%]', delay: '-2s' },
  { key: 'chat', place: 'end-[2%] top-[40%]', delay: '-1s' },
  { key: 'parents', place: 'end-[9%] bottom-[33%]', delay: '-5s' },
]

/** The ribbon at the bottom: every feature, in two rows moving opposite ways. */
const RIBBON: FeatureKey[][] = [
  ['quizzes', 'homework', 'classes', 'alerts', 'scales', 'currency', 'preview', 'page'],
  ['uploads', 'languages', 'schedule', 'exams', 'grades', 'video', 'chat', 'parents'],
]

/** One feature as a frosted-glass pill with its gradient tile. */
function Pill({ k, label, size = 'md' }: { k: FeatureKey; label: string; size?: 'sm' | 'md' }) {
  const f = FEATURE[k]
  return (
    <span
      className={cn(
        'flex flex-none items-center gap-2.5 rounded-2xl bg-background/60 font-medium whitespace-nowrap ring-1 ring-foreground/6 backdrop-blur-xl backdrop-saturate-150 dark:bg-foreground/8',
        size === 'md' ? 'py-2 ps-2 pe-4 text-sm' : 'py-1.5 ps-1.5 pe-3.5 text-[0.8125rem]',
      )}
    >
      <span className={cn('grid place-items-center rounded-xl bg-linear-to-b text-primary-foreground', size === 'md' ? 'size-8' : 'size-7', f.tile)}>
        <Icon name={f.icon} className="size-4" />
      </span>
      {label}
    </span>
  )
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The home page's first screen (owner: "it must look like it came from the future, wow"):
 * - a full-width living aurora: four huge soft blurs (green, blue, purple, rose; each ONE hue)
 *   wandering on their own paths while the whole field slowly shifts its colours (holographic);
 * - a perspective grid floor gliding toward the viewer, fading into the horizon;
 * - the headline appearing word by word out of a blur, then the line and the buttons;
 * - a soft light following the pointer (desktop);
 * - six frosted-glass feature chips floating around the headline (wide screens), and every feature
 *   as an endless two-row ribbon at the bottom (pauses on hover).
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
  chips: Record<FeatureKey, string>
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
      {FLOATING.map((c, i) => (
        <motion.div
          key={c.key}
          aria-hidden
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.9 + i * 0.1, duration: 0.6, ease: EASE }}
          className={cn('absolute hidden xl:block', c.place)}
        >
          <span
            className="block rounded-2xl shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_12px_32px_-12px_color-mix(in_oklch,var(--foreground)_20%,transparent)] motion-safe:animate-float dark:shadow-none"
            style={{ animationDelay: c.delay }}
          >
            <Pill k={c.key} label={chips[c.key]} />
          </span>
        </motion.div>
      ))}

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

      {/* every feature as an endless two-row ribbon (pauses on hover; still for reduced motion) */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 1.2, duration: 0.8 }}
        className="group/ribbon mt-16 flex w-full flex-col gap-3 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] sm:mt-20"
      >
        {RIBBON.map((row, r) => (
          <ul
            key={r}
            className={cn(
              'flex w-max gap-3 group-hover/ribbon:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center',
              r === 0 ? 'motion-safe:animate-marquee rtl:motion-safe:animate-marquee-rtl' : 'motion-safe:animate-marquee-reverse rtl:motion-safe:animate-marquee-rtl-reverse',
            )}
          >
            {/* the row twice: moving by half its width loops it seamlessly (the copy is hidden from screen readers) */}
            {[...row, ...row].map((k, i) => (
              <li key={i} aria-hidden={i >= row.length} className={cn(i >= row.length && 'motion-reduce:hidden')}>
                <Pill k={k} label={chips[k]} size="sm" />
              </li>
            ))}
          </ul>
        ))}
      </motion.div>
    </section>
  )
}
