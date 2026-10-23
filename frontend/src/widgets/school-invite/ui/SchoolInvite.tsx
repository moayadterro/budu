import { LocalLink as Link } from '@/shared/ui/local-link'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/** What a school gets, as app icons: one deep hue per icon (lighter at the top, like Apple's icons). */
const APPS = [
  { key: 'portal', icon: 'globe', tile: 'bg-linear-to-b from-primary/75 to-primary' },
  { key: 'schedule', icon: 'cal', tile: 'bg-linear-to-b from-info/75 to-info' },
  { key: 'exams', icon: 'task', tile: 'bg-linear-to-b from-subject-purple/75 to-subject-purple' },
  { key: 'gradebook', icon: 'report', tile: 'bg-linear-to-b from-foreground/70 to-foreground text-background' },
] as const

/**
 * "Bring your school to Budu": the closing invitation for schools, used as our own banner across
 * the public site (pricing, the course catalog). The Apple way: no box, no background, big type on
 * white space, the four things a school gets as app-style icons (each one deep, one-hue squircle),
 * one button to the school sign-up and a quiet "›" link to ask for a price.
 */
export async function SchoolInvite({ className }: { className?: string }) {
  const c = (await getT()).site.pricing.cta
  return (
    <section className={cn('flex flex-col items-center gap-8 py-4 text-center sm:py-10', className)}>
      <ul className="flex flex-wrap justify-center gap-5 sm:gap-8">
        {APPS.map((a) => (
          <li key={a.key} className="flex w-18 flex-col items-center gap-2 sm:w-20">
            <span
              className={cn(
                'grid size-16 place-items-center rounded-[1.35rem] text-primary-foreground shadow-[0_1px_1px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_8px_20px_-8px_color-mix(in_oklch,var(--foreground)_25%,transparent)] sm:size-18 dark:shadow-none sm:rounded-[1.5rem]',
                a.tile,
              )}
            >
              <Icon name={a.icon} className="size-7 sm:size-8" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">{c.apps[a.key]}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-4">
        <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{c.title}</h2>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">{c.sub}</p>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <Button size="lg" className="h-12 px-7 text-base" asChild>
          <Link href="/register?as=school">{c.primary}</Link>
        </Button>
        <Link href="/contact?topic=school" className="group flex items-center gap-1 text-base font-medium text-primary dark:text-success">
          <span className="group-hover:underline group-hover:underline-offset-4">{c.secondary}</span>
          <Icon name="chevRight" className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}
