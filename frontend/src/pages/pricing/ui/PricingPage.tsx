import { LocalLink as Link } from '@/shared/ui/local-link'
import { SITE } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/** Each side plan / coming-soon idea gets its own colour, as complete class names (Tailwind sees them). */
const TONE = {
  info: { glow: 'from-info/18', tile: 'bg-info/12 text-info', blob: 'bg-info/25' },
  purple: { glow: 'from-subject-purple/18', tile: 'bg-subject-purple/12 text-subject-purple', blob: 'bg-subject-purple/25' },
  amber: { glow: 'from-highlight/20', tile: 'bg-highlight/15 text-highlight', blob: 'bg-highlight/30' },
  terra: { glow: 'from-subject-terra/18', tile: 'bg-subject-terra/12 text-subject-terra', blob: 'bg-subject-terra/25' },
} as const
type Tone = keyof typeof TONE

/**
 * Public: plans (owner) — students always free; teachers free (the AI creator kit will be paid);
 * schools free up to SITE.freeSchool, then an offer. The page has one job: get people to sign up
 * and schools to try Budu — so every plan's button opens that exact sign-up (`/register?as=…`),
 * true "no barrier" facts sit by the buttons, and a closing band invites schools again.
 * Design: showcase, not boxes — soft brand glows fading into the page, the school plan raised in
 * the middle on the brand gradient, glass panels for the others, coloured tiles instead of borders.
 */
export async function PricingPage() {
  const t = await getT()
  const s = t.site.pricing
  const free = SITE.freeSchool

  const side = (key: 'students' | 'teachers', icon: IconName, tone: Tone, href: string) => {
    const p = s[key]
    const c = TONE[tone]
    return (
      <article className="relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl bg-card/70 p-6 shadow-xl ring-1 shadow-foreground/5 ring-foreground/8 backdrop-blur-sm transition-transform duration-300 motion-safe:hover:-translate-y-1 sm:p-8">
        <div aria-hidden className={cn('absolute inset-x-0 top-0 -z-10 h-44 bg-linear-to-b to-transparent', c.glow)} />
        <div className="flex items-center gap-3">
          <span className={cn('grid size-11 place-items-center rounded-2xl', c.tile)}>
            <Icon name={icon} className="size-5" />
          </span>
          <h2 className="text-lg font-semibold">{p.name}</h2>
        </div>
        <div>
          <p className="font-heading text-5xl font-semibold tracking-tight">{p.price}</p>
          <p className="mt-2 text-sm text-muted-foreground">{p.who}</p>
        </div>
        <Button variant="outline" size="lg" className="h-auto min-h-11 w-full py-2.5 whitespace-normal" asChild>
          <Link href={href}>{p.cta}</Link>
        </Button>
        <ul className="flex flex-col gap-3 text-sm">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-4.5 flex-none place-items-center rounded-full bg-primary/12 text-primary">
                <Icon name="tick" className="size-3" />
              </span>
              <span className="text-foreground/85">{f}</span>
            </li>
          ))}
        </ul>
        {'soon' in p && (
          <p className="mt-auto flex items-center gap-2 border-t border-foreground/8 pt-4 text-sm text-muted-foreground">
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
    { key: 'games', icon: 'trophy', tone: 'amber' },
    { key: 'cowork', icon: 'board', tone: 'info' },
    { key: 'clubs', icon: 'users', tone: 'terra' },
  ]

  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      {/* hero on soft brand glows that fade into the page */}
      <section className="relative isolate flex flex-col items-center gap-5 pt-6 text-center sm:pt-12">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 -z-10 flex justify-center">
          <div className="h-72 w-160 max-w-full rounded-full bg-primary/20 blur-3xl dark:bg-primary/12" />
          <div className="-ms-48 mt-20 hidden h-56 w-80 rounded-full bg-subject-purple/15 blur-3xl sm:block dark:bg-subject-purple/10" />
        </div>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">{s.eyebrow}</p>
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

      {/* the plans: the school one in the middle, raised, on the brand gradient */}
      <section className="grid items-stretch gap-6 lg:grid-cols-3 lg:items-center lg:gap-5">
        {side('students', 'book', 'info', '/register?as=student')}

        <article className="relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground shadow-2xl shadow-primary/25 sm:p-8 lg:py-12">
          <div aria-hidden className="absolute -end-24 -top-24 -z-10 size-72 rounded-full bg-highlight/30 blur-3xl" />
          <div aria-hidden className="absolute -start-20 -bottom-28 -z-10 size-72 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/15">
                <Icon name="users" className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{school.name}</h2>
            </div>
            <span className="rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-highlight-foreground">{school.badge}</span>
          </div>
          <div>
            <p className="font-heading text-5xl font-semibold tracking-tight">{school.price}</p>
            <p className="mt-2 text-sm text-primary-foreground/80">{school.who(free.teachers, free.students)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="highlight" size="lg" className="h-auto min-h-12 w-full py-3 text-base whitespace-normal" asChild>
              <Link href="/register?as=school">{school.cta}</Link>
            </Button>
            <Link
              href="/contact?topic=school"
              className="self-center rounded-md px-2 py-1 text-center text-sm text-balance text-primary-foreground/80 underline-offset-4 transition-colors hover:text-primary-foreground hover:underline"
            >
              {school.quote}
            </Link>
          </div>
          <ul className="flex flex-col gap-3 text-sm">
            {school.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-4.5 flex-none place-items-center rounded-full bg-primary-foreground/20">
                  <Icon name="tick" className="size-3" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </article>

        {side('teachers', 'board', 'purple', '/register?as=teacher')}
      </section>

      <p className="-mt-12 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground sm:-mt-20">
        <Icon name="wallet" className="size-4 flex-none" />
        {s.paidCourses}
      </p>

      {/* coming soon: each idea with its own colour */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">{s.soonEyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{s.soonTitle}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {soon.map(({ key, icon, tone }) => {
            const c = TONE[tone]
            const item = s.soon[key]
            return (
              <article key={key} className="relative isolate flex gap-4 overflow-hidden rounded-3xl bg-card/60 p-6 ring-1 ring-foreground/8 sm:p-7">
                <div aria-hidden className={cn('absolute -start-16 -bottom-20 -z-10 size-52 rounded-full blur-3xl', c.blob)} />
                <span className={cn('grid size-12 flex-none place-items-center rounded-2xl', c.tile)}>
                  <Icon name={icon} className="size-6" />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <span className="rounded-full bg-foreground/6 px-2 py-0.5 text-xs font-medium text-muted-foreground">{s.soonBadge}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* closing invitation for schools */}
      <section className="relative isolate flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-brand px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
        <div aria-hidden className="absolute -top-28 start-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-highlight/25 blur-3xl rtl:translate-x-1/2" />
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{s.cta.title}</h2>
        <p className="max-w-xl text-pretty text-primary-foreground/85">{s.cta.sub(free.teachers, free.students)}</p>
        <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button variant="highlight" size="lg" className="h-12 px-6 text-base" asChild>
            <Link href="/register?as=school">{s.cta.primary}</Link>
          </Button>
          <Button variant="ghost" size="lg" className="h-12 px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
            <Link href="/contact?topic=school">{s.cta.secondary}</Link>
          </Button>
        </div>
      </section>

      {/* questions: a clean list, no boxes */}
      <section className="mx-auto flex w-full max-w-3xl flex-col">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{s.faqTitle}</h2>
        {s.faq.map((f) => (
          <details key={f.q} className="group border-b border-foreground/10 py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {f.q}
              <span className="grid size-8 flex-none place-items-center rounded-full bg-foreground/5 transition-transform group-open:rotate-45">
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
