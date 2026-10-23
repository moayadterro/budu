import { LocalLink as Link } from '@/shared/ui/local-link'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { SoonBadge } from '@/shared/ui/soon-badge'
import { SchoolInvite } from '@/widgets/school-invite'
import { JsonLd } from '@/shared/ui/json-ld'
import { getLocale, getT } from '@/shared/i18n/server'
import { localePath } from '@/shared/i18n'
import { absoluteUrl } from '@/shared/server/seo'

/**
 * Public: plans (owner) — "learning should be fun": students get free access (we support them),
 * teachers start without paying (the AI creator kit will be paid), schools pay by their number of
 * students. The page has one job: get people to sign up and schools to try Budu — every plan's
 * button opens that exact sign-up (`/register?as=…`) and a closing band invites schools again.
 * Design (owner: "2027, modern and simple"): no borders, no orange, and every gradient is ONE hue
 * fading into the page (never several colours mixed): teachers blue, students the theme's green,
 * schools purple — light tints; teachers first, students in the middle (raised), schools last.
 * SEO: the eyebrow is part of the h1 (the heading says it's the pricing page), and the plans are
 * also described as schema.org data (page, breadcrumb, an offer catalog with each plan's price). Soft surfaces, large radii.
 * Depth without colour (UI/UX Pro Max "soft UI" + "aurora"): a fine dot texture fading out behind
 * the hero and the closing band, layered soft NEUTRAL shadows instead of borders. Never a coloured
 * glow or coloured shadow behind a card.
 */

/** One hue per card: the top fade, the icon tile and (coming soon) the glow — complete class names. */
const TONE = {
  blue: { fade: 'from-info/10 dark:from-info/8', tile: 'bg-info/12 text-info', glow: 'bg-info/7 dark:bg-info/12', mark: 'text-info', button: 'bg-info/12 text-info hover:bg-info/20' },
  purple: {
    fade: 'from-subject-purple/10 dark:from-subject-purple/8',
    tile: 'bg-subject-purple/12 text-subject-purple',
    glow: 'bg-subject-purple/7 dark:bg-subject-purple/12',
    mark: 'text-subject-purple',
    button: 'bg-subject-purple/12 text-subject-purple hover:bg-subject-purple/20',
  },
  // dark mode: the theme's deep emerald is too dark for text, so text uses the lighter success green
  green: {
    fade: 'from-primary/10 dark:from-success/7',
    tile: 'bg-primary/12 text-primary dark:bg-success/15 dark:text-success',
    glow: 'bg-primary/7 dark:bg-success/10',
    mark: 'text-primary dark:text-success',
    button: 'bg-primary/12 text-primary hover:bg-primary/20 dark:bg-success/15 dark:text-success dark:hover:bg-success/22',
  },
} as const
type Tone = keyof typeof TONE

export async function PricingPage() {
  const t = await getT()
  const s = t.site.pricing

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
          // a soft edge pushed slightly down: it spreads a little on the sides and bottom and fades
          // out before the top, where the colour is (owner: no line along the top). Dark mode: none
          // (mixed from the light text colour, a shadow turns into a white halo there)
          'shadow-[0_3px_8px_-2px_color-mix(in_oklch,var(--foreground)_9%,transparent),0_10px_24px_-10px_color-mix(in_oklch,var(--foreground)_8%,transparent)] dark:shadow-none',
          raised && 'lg:py-12',
          c.fade,
        )}
      >
        {/* the plan's own symbol, big and faint, whole, inside the top-end corner — no tile around it */}
        <Icon aria-hidden name={icon} className={cn('pointer-events-none absolute end-5 top-5 -z-10 size-20 opacity-[0.16] sm:end-6 sm:top-6 sm:size-24 dark:opacity-[0.22]', c.mark)} />
        <div className="flex flex-wrap items-center gap-3 pe-20 sm:pe-24">
          <h2 className="text-lg font-semibold">{p.name}</h2>
        </div>
        <div>
          <p className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-3xl xl:text-4xl">{p.price}</p>
          <p className="mt-2 text-[0.8125rem] text-muted-foreground">{p.who}</p>
        </div>
        {isSchool ? (
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="lg" className={cn('h-auto min-h-11 w-full py-2.5 font-semibold whitespace-normal', c.button)} asChild>
              <Link href={href}>{p.cta}</Link>
            </Button>
            <Link href="/contact?topic=school" className={cn('self-center rounded-md px-2 py-1 text-center text-[0.8125rem] text-balance underline-offset-4 hover:underline', c.mark)}>
              {s.schools.quote}
            </Link>
          </div>
        ) : (
          // Apple's "tinted" button: a light fill in the card's own colour, coloured text, no shadow —
          // the same for all three plans (owner: no plan shouts; the visitor picks who they are)
          <Button variant="ghost" size="lg" className={cn('h-auto min-h-11 w-full py-2.5 font-semibold whitespace-normal', c.button)} asChild>
            <Link href={href}>{p.cta}</Link>
          </Button>
        )}
        <ul className="flex flex-col gap-3 text-sm">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              {/* a plain checkmark in the card's own colour, no circle around it (the Apple way) */}
              <Icon name="tick" strokeWidth={2.2} className={cn('mt-0.5 size-4 flex-none', c.mark)} />
              <span className="text-foreground/85">{f}</span>
            </li>
          ))}
        </ul>
        {/* not built yet: rows like the features above, amber instead of a tick, with the badge */}
        {p.soon.length > 0 && (
          <ul className="mt-auto flex flex-col gap-3 pt-1 text-sm">
            {p.soon.map((x) => (
              <li key={x} className="flex items-start gap-2.5">
                <Icon name="spark" strokeWidth={2} className="mt-0.5 size-4 flex-none text-warning" />
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground/85">
                  {x}
                  <SoonBadge label={s.soonBadge} />
                </span>
              </li>
            ))}
          </ul>
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

  // what search engines read: the page, where it sits, and the three plans with their prices
  const locale = await getLocale()
  const url = absoluteUrl(localePath('/pricing', locale))
  const offer = (key: 'teachers' | 'students' | 'schools', price: number | null) => ({
    '@type': 'Offer',
    name: s[key].name,
    description: s[key].who,
    url: absoluteUrl(`/register?as=${key === 'schools' ? 'school' : key === 'students' ? 'student' : 'teacher'}`),
    ...(price === null ? {} : { price, priceCurrency: 'RUB' }),
    itemOffered: { '@type': 'Service', name: `Budu: ${s[key].name}`, description: s[key].features.join('. ') },
  })
  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: t.seo.pricing.title,
        description: t.seo.pricing.description,
        inLanguage: locale,
        isPartOf: { '@type': 'WebSite', name: 'Budu', url: absoluteUrl(localePath('/', locale)) },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#plans` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Budu', item: absoluteUrl(localePath('/', locale)) },
          { '@type': 'ListItem', position: 2, name: s.eyebrow, item: url },
        ],
      },
      {
        '@type': 'OfferCatalog',
        '@id': `${url}#plans`,
        name: s.eyebrow,
        // schools: priced by their number of students, on request, so no price is claimed
        itemListElement: [offer('teachers', 0), offer('students', 0), offer('schools', null)],
      },
    ],
  }

  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      <JsonLd data={structured} />
      {/* hero: a light, wide, slowly moving blur — two soft one-hue shapes (green top-start, blue at
          the bottom; never more) drifting in different rhythms; still for people who turn motion off */}
      <section className="relative isolate flex flex-col items-center gap-5 pt-6 text-center sm:pt-12">
        {/* no visible box: the shapes sit well inside a large area (their blur fades to nothing before
            any edge), and the area itself fades out softly all the way to its edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-32 -top-60 -bottom-48 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_closest-side_at_50%_50%,#000_60%,transparent_100%)]"
        >
          <div className="absolute start-[7%] top-[14%] h-[20rem] w-[30rem] max-w-[55%] rounded-full bg-primary/30 blur-[90px] motion-safe:animate-aurora dark:bg-primary/35" />
          <div className="absolute end-[7%] bottom-[12%] h-[18rem] w-[28rem] max-w-[50%] rounded-full bg-info/28 blur-[90px] [animation-delay:-7s] [animation-direction:alternate-reverse] motion-safe:animate-aurora dark:bg-info/35" />
        </div>
        <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-20 bottom-0 -z-10 bg-dots" />
        {/* one heading for search engines ("Pricing: learning should be fun"), looks unchanged */}
        <h1 className="flex flex-col items-center gap-5">
          <span className="font-sans text-xs font-semibold tracking-wider text-primary uppercase dark:text-success">{s.eyebrow}</span>
          <span className="sr-only">: </span>
          <span className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{s.title}</span>
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{s.sub}</p>
        {/* the good news as frosted glass, the iPhone way: translucent, heavy blur, soft neutral
            shadow, an emoji instead of an icon tile */}
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-background/55 py-2 ps-3 pe-4 text-sm font-semibold text-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_70%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_10px_30px_-10px_color-mix(in_oklch,var(--foreground)_22%,transparent)] backdrop-blur-xl backdrop-saturate-150 dark:bg-foreground/8 dark:shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_10px_30px_-10px_color-mix(in_oklch,var(--background)_80%,transparent)]">
          <span aria-hidden className="text-base leading-none">🎓</span>
          {s.free}
        </p>
      </section>

      {/* the plans: teachers · students (in the middle, raised) · schools — each in its own light hue */}
      <section className="grid items-stretch gap-6 lg:grid-cols-3 lg:items-center lg:gap-5">
        {plan('teachers', 'teacher', 'blue', '/register?as=teacher')}
        {plan('students', 'student', 'green', '/register?as=student', true)}
        {plan('schools', 'school', 'purple', '/register?as=school')}
      </section>

      <p className="-mt-12 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground sm:-mt-20">
        <Icon name="wallet" className="size-4 flex-none" />
        {s.paidCourses}
      </p>

      {/* coming soon: the two biggest ideas wide on top, the other three below */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
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
                  // a hairline edge (owner: show it's a card, very lightly) + a soft fade from the top corner
                  'relative isolate flex gap-4 overflow-hidden rounded-3xl bg-linear-to-br from-muted/60 to-card p-6 ring-1 ring-foreground/6 ring-inset sm:p-7 rtl:bg-linear-to-bl dark:from-muted/40 dark:ring-foreground/8',
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
                    <SoonBadge label={s.soonBadge} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <SchoolInvite />

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
