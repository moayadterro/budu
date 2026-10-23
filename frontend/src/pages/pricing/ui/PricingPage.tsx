import { LocalLink as Link } from '@/shared/ui/local-link'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/**
 * Public: plans (owner) — "learning should be fun": students get free access (we support them),
 * teachers start without paying (the AI creator kit will be paid), schools pay by their number of
 * students. The page has one job: get people to sign up and schools to try Budu — every plan's
 * button opens that exact sign-up (`/register?as=…`) and a closing band invites schools again.
 * Design (owner: "2027, modern and simple"): no borders, no orange, and every gradient is ONE hue
 * fading into the page (never several colours mixed): students blue, teachers purple, schools the
 * theme's green — light tints; students in the middle, raised. Soft surfaces, large radii.
 * Depth without colour (UI/UX Pro Max "soft UI" + "aurora"): a fine dot texture fading out behind
 * the hero and the closing band, layered soft NEUTRAL shadows instead of borders. Never a coloured
 * glow or coloured shadow behind a card.
 */

/** One hue per card: the top fade, the icon tile and (coming soon) the glow — complete class names. */
const TONE = {
  blue: { fade: 'from-info/10 dark:from-info/16', tile: 'bg-info/12 text-info', glow: 'bg-info/20', mark: 'text-info', button: 'bg-info/12 text-info hover:bg-info/20' },
  purple: {
    fade: 'from-subject-purple/10 dark:from-subject-purple/16',
    tile: 'bg-subject-purple/12 text-subject-purple',
    glow: 'bg-subject-purple/20',
    mark: 'text-subject-purple',
    button: 'bg-subject-purple/12 text-subject-purple hover:bg-subject-purple/20',
  },
  green: { fade: 'from-primary/10 dark:from-primary/16', tile: 'bg-primary/12 text-primary', glow: 'bg-primary/20', mark: 'text-primary', button: 'bg-primary/12 text-primary hover:bg-primary/20' },
} as const
type Tone = keyof typeof TONE

/** What a school gets, as app icons: one deep hue per icon (lighter at the top, like Apple's icons). */
const APPS = [
  { key: 'portal', icon: 'globe', tile: 'bg-linear-to-b from-primary/75 to-primary' },
  { key: 'schedule', icon: 'cal', tile: 'bg-linear-to-b from-info/75 to-info' },
  { key: 'exams', icon: 'task', tile: 'bg-linear-to-b from-subject-purple/75 to-subject-purple' },
  { key: 'gradebook', icon: 'report', tile: 'bg-linear-to-b from-foreground/70 to-foreground text-background' },
] as const
export async function PricingPage() {
  const t = await getT()
  const s = t.site.pricing

  const tick = (
    <span className="mt-0.5 grid size-4.5 flex-none place-items-center rounded-full bg-primary/12 text-primary">
      <Icon name="tick" className="size-3" />
    </span>
  )

  /** A plan: one-hue fade from the top, icon tile, price, the sign-up button, what's included. */
  const plan = (key: 'students' | 'teachers' | 'schools', icon: IconName, tone: Tone, href: string, raised = false) => {
    const p = s[key]
    const c = TONE[tone]
    const isSchool = key === 'schools'
    return (
      <article
        className={cn(
          // the colour flows from the top-start corner (owner); the big symbol sits in the top-end one
          'relative isolate flex flex-col gap-6 rounded-3xl bg-linear-to-br to-card p-6 transition-transform duration-300 motion-safe:hover:-translate-y-1 sm:p-8 rtl:bg-linear-to-bl',
          // soft NEUTRAL shadows only — never a coloured glow behind a card (owner)
          raised
            ? 'shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_24px_48px_-16px_color-mix(in_oklch,var(--foreground)_16%,transparent)] lg:py-12'
            : 'shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_5%,transparent),0_12px_32px_-12px_color-mix(in_oklch,var(--foreground)_12%,transparent)]',
          c.fade,
        )}
      >
        {/* the plan's own symbol, big and faint, whole, inside the top-end corner — no tile around it */}
        <Icon aria-hidden name={icon} className={cn('pointer-events-none absolute end-5 top-5 -z-10 size-20 opacity-[0.16] sm:end-6 sm:top-6 sm:size-24 dark:opacity-[0.22]', c.mark)} />
        <div className="flex flex-wrap items-center gap-3 pe-20 sm:pe-24">
          <h2 className="text-lg font-semibold">{p.name}</h2>
          {isSchool && <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary dark:text-success">{s.schools.badge}</span>}
        </div>
        <div>
          <p className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-3xl xl:text-4xl">{p.price}</p>
          <p className="mt-2 text-sm text-muted-foreground">{p.who}</p>
        </div>
        {isSchool ? (
          <div className="flex flex-col gap-2">
            <Button size="lg" className="h-auto min-h-11 w-full py-2.5 whitespace-normal" asChild>
              <Link href={href}>{p.cta}</Link>
            </Button>
            <Link href="/contact?topic=school" className="self-center rounded-md px-2 py-1 text-center text-sm text-balance text-primary underline-offset-4 dark:text-success hover:underline">
              {s.schools.quote}
            </Link>
          </div>
        ) : (
          // Apple's "tinted" button: a light fill in the card's own colour, coloured text, no shadow
          <Button variant="ghost" size="lg" className={cn('h-auto min-h-11 w-full py-2.5 font-semibold whitespace-normal', c.button)} asChild>
            <Link href={href}>{p.cta}</Link>
          </Button>
        )}
        <ul className="flex flex-col gap-3 text-sm">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              {tick}
              <span className="text-foreground/85">{f}</span>
            </li>
          ))}
        </ul>
        {'soon' in p && (
          <p className="mt-auto flex items-center gap-2 pt-2 text-sm text-muted-foreground">
            <Icon name="spark" className="size-4 text-warning" />
            {p.soon}
          </p>
        )}
      </article>
    )
  }

  const soon: Array<{ key: keyof typeof s.soon; icon: IconName; tone: Tone }> = [
    { key: 'ai', icon: 'spark', tone: 'purple' },
    { key: 'certificates', icon: 'file', tone: 'green' },
    { key: 'games', icon: 'trophy', tone: 'blue' },
    { key: 'cowork', icon: 'board', tone: 'purple' },
    { key: 'clubs', icon: 'users', tone: 'green' },
  ]

  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      {/* hero: one soft green glow fading into the page */}
      <section className="relative isolate flex flex-col items-center gap-5 pt-6 text-center sm:pt-12">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 -z-10 flex justify-center">
          <div className="h-72 w-160 max-w-full rounded-full bg-primary/15 blur-3xl motion-safe:animate-aurora dark:bg-primary/10" />
        </div>
        <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-20 bottom-0 -z-10 bg-dots" />
        <p className="text-xs font-semibold tracking-wider text-primary uppercase dark:text-success">{s.eyebrow}</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{s.title}</h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{s.sub}</p>
        <ul className="mt-1 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {s.trust.map((x) => (
            <li key={x} className="flex items-center gap-1.5">
              <Icon name="tick" className="size-4 text-primary" />
              {x}
            </li>
          ))}
        </ul>
      </section>

      {/* the plans: schools · students (in the middle, raised) · teachers — each in its own light hue */}
      <section className="grid items-stretch gap-6 lg:grid-cols-3 lg:items-center lg:gap-5">
        {plan('schools', 'school', 'green', '/register?as=school')}
        {plan('students', 'student', 'blue', '/register?as=student', true)}
        {plan('teachers', 'teacher', 'purple', '/register?as=teacher')}
      </section>

      <p className="-mt-12 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground sm:-mt-20">
        <Icon name="wallet" className="size-4 flex-none" />
        {s.paidCourses}
      </p>

      {/* coming soon: the two biggest ideas wide on top, the other three below */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold tracking-wider text-warning uppercase">{s.soonEyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{s.soonTitle}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {soon.map(({ key, icon, tone }, i) => {
            const item = s.soon[key]
            const c = TONE[tone]
            return (
              <article
                key={key}
                className={cn(
                  'relative isolate flex gap-4 overflow-hidden rounded-3xl bg-muted/40 p-6 sm:p-7',
                  i < 2 ? 'lg:col-span-3' : 'lg:col-span-2',
                  i === soon.length - 1 && 'sm:col-span-2 lg:col-span-2',
                )}
              >
                {/* one hue, glowing on the far side — the icon is at the start */}
                <div aria-hidden className={cn('absolute -end-16 -bottom-20 -z-10 size-52 rounded-full blur-3xl', c.glow)} />
                <span className={cn('grid size-12 flex-none place-items-center rounded-2xl', c.tile)}>
                  <Icon name={icon} className="size-6" />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    {/* "coming soon" is amber everywhere — green means it already exists */}
                    <span className="rounded-full bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning">{s.soonBadge}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* closing invitation for schools, the Apple way: no box, no background — big type on white
          space, the four things a school gets as app-style icons (each one deep, one-hue squircle),
          one button and a quiet "›" link */}
      <section className="flex flex-col items-center gap-8 py-4 text-center sm:py-10">
        <ul className="flex flex-wrap justify-center gap-5 sm:gap-8">
          {APPS.map((a) => (
            <li key={a.key} className="flex w-18 flex-col items-center gap-2 sm:w-20">
              <span
                className={cn(
                  'grid size-16 place-items-center rounded-[1.35rem] text-primary-foreground shadow-[0_1px_1px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_8px_20px_-8px_color-mix(in_oklch,var(--foreground)_25%,transparent)] sm:size-18 sm:rounded-[1.5rem]',
                  a.tile,
                )}
              >
                <Icon name={a.icon} className="size-7 sm:size-8" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">{s.cta.apps[a.key]}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-4">
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{s.cta.title}</h2>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">{s.cta.sub}</p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Button size="lg" className="h-12 px-7 text-base" asChild>
            <Link href="/register?as=school">{s.cta.primary}</Link>
          </Button>
          <Link href="/contact?topic=school" className="group flex items-center gap-1 text-base font-medium text-primary dark:text-success">
            <span className="group-hover:underline group-hover:underline-offset-4">{s.cta.secondary}</span>
            <Icon name="chevRight" className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* questions: soft rows, no lines */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">{s.faqTitle}</h2>
        {s.faq.map((f) => (
          <details key={f.q} className="group rounded-2xl bg-muted/50 px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {f.q}
              <span className="grid size-8 flex-none place-items-center rounded-full bg-background text-primary transition-transform group-open:rotate-45">
                <Icon name="plus" className="size-4" />
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </section>
    </div>
  )
}
