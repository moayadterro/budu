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
 * theme's green — the school plan in the middle, lifted. Soft surfaces, large radii, soft shadows.
 * Depth without colour (UI/UX Pro Max "soft UI" + "aurora"): a fine dot texture fading out behind
 * the hero and the closing band, layered soft shadows instead of borders, and the school plan as a
 * frosted glass card over a slowly drifting green glow (motion only when the user allows it).
 */

/** One hue per card: the top fade, the icon tile and (coming soon) the glow — complete class names. */
const TONE = {
  blue: { fade: 'from-info/14', tile: 'bg-info/12 text-info', glow: 'bg-info/20' },
  purple: { fade: 'from-subject-purple/14', tile: 'bg-subject-purple/12 text-subject-purple', glow: 'bg-subject-purple/20' },
  green: { fade: 'from-primary/14', tile: 'bg-primary/12 text-primary', glow: 'bg-primary/20' },
} as const
type Tone = keyof typeof TONE
export async function PricingPage() {
  const t = await getT()
  const s = t.site.pricing

  const tick = (
    <span className="mt-0.5 grid size-4.5 flex-none place-items-center rounded-full bg-primary/12 text-primary">
      <Icon name="tick" className="size-3" />
    </span>
  )

  const side = (key: 'students' | 'teachers', icon: IconName, tone: Tone, href: string) => {
    const p = s[key]
    const c = TONE[tone]
    return (
      <article
        className={cn(
          'flex flex-col gap-6 rounded-3xl bg-linear-to-b to-card p-6 shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_5%,transparent),0_12px_32px_-12px_color-mix(in_oklch,var(--foreground)_12%,transparent)] transition-transform duration-300 motion-safe:hover:-translate-y-1 sm:p-8',
          c.fade,
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn('grid size-11 place-items-center rounded-2xl', c.tile)}>
            <Icon name={icon} className="size-5" />
          </span>
          <h2 className="text-lg font-semibold">{p.name}</h2>
        </div>
        <div>
          <p className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-3xl xl:text-4xl">{p.price}</p>
          <p className="mt-2 text-sm text-muted-foreground">{p.who}</p>
        </div>
        <Button variant="secondary" size="lg" className="h-auto min-h-11 w-full bg-background py-2.5 whitespace-normal shadow-sm hover:bg-background/70" asChild>
          <Link href={href}>{p.cta}</Link>
        </Button>
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
            <Icon name="spark" className="size-4 text-subject-purple" />
            {p.soon}
          </p>
        )}
      </article>
    )
  }

  const school = s.schools
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

      {/* the plans: the school one in the middle, lifted, on a light green tint */}
      <section className="grid items-stretch gap-6 lg:grid-cols-3 lg:items-center lg:gap-5">
        {side('students', 'book', 'blue', '/register?as=student')}

        <div className="relative isolate">
          {/* the glow lives BEHIND the glass card and drifts slowly */}
          <div aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10 rounded-[3rem] bg-primary/30 blur-3xl motion-safe:animate-aurora dark:bg-primary/20" />
        <article className="flex flex-col gap-6 rounded-3xl bg-card/75 p-6 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_80%,transparent),0_24px_60px_-20px_color-mix(in_oklch,var(--primary)_35%,transparent)] backdrop-blur-xl backdrop-saturate-150 sm:p-8 lg:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <Icon name="users" className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{school.name}</h2>
            </div>
            <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary dark:text-success">{school.badge}</span>
          </div>
          <div>
            <p className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-3xl xl:text-4xl">{school.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{school.who}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="lg" className="h-auto min-h-12 w-full py-3 text-base whitespace-normal" asChild>
              <Link href="/register?as=school">{school.cta}</Link>
            </Button>
            <Link href="/contact?topic=school" className="self-center rounded-md px-2 py-1 text-center text-sm text-balance text-primary underline-offset-4 dark:text-success hover:underline">
              {school.quote}
            </Link>
          </div>
          <ul className="flex flex-col gap-3 text-sm">
            {school.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                {tick}
                <span className="text-foreground/85">{f}</span>
              </li>
            ))}
          </ul>
        </article>
        </div>

        {side('teachers', 'board', 'purple', '/register?as=teacher')}
      </section>

      <p className="-mt-12 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground sm:-mt-20">
        <Icon name="wallet" className="size-4 flex-none" />
        {s.paidCourses}
      </p>

      {/* coming soon: the two biggest ideas wide on top, the other three below */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase dark:text-success">{s.soonEyebrow}</p>
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
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:text-success">{s.soonBadge}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* closing invitation for schools, on the same light green */}
      <section className="relative isolate flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-muted/40 px-6 py-14 text-center sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-dots" />
        <div aria-hidden className="pointer-events-none absolute -top-32 start-1/2 -z-10 h-72 w-120 max-w-full -translate-x-1/2 rounded-full bg-primary/20 blur-3xl motion-safe:animate-aurora rtl:translate-x-1/2 dark:bg-primary/15" />
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{s.cta.title}</h2>
        <p className="max-w-xl text-pretty text-muted-foreground">{s.cta.sub}</p>
        <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button size="lg" className="h-12 px-6 text-base" asChild>
            <Link href="/register?as=school">{s.cta.primary}</Link>
          </Button>
          <Button variant="secondary" size="lg" className="h-12 bg-background px-6 text-base shadow-sm hover:bg-background/70" asChild>
            <Link href="/contact?topic=school">{s.cta.secondary}</Link>
          </Button>
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
