import Link from 'next/link'
import { publicSchools } from '@/entities/tenant/server'
import { BrandImage } from '@/shared/ui/brand-image'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { PublicHero } from '@/shared/ui/public-hero'
import { getT } from '@/shared/i18n/server'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/** Public: schools that chose to be listed (a manager's switch in Settings — off by default). */
export async function PublicSchoolsPage() {
  const t = await getT()
  const s = t.site.schools
  const schools = await publicSchools()
  return (
    <div className="flex flex-col gap-12">
      <PublicHero title={s.title} sub={s.sub} />
      {schools.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="layers" />
            </EmptyMedia>
            <EmptyTitle>{s.empty}</EmptyTitle>
            <EmptyDescription>{s.emptyHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((x) => (
            <li key={x.slug}>
              <Link
                href={`/schools/${x.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {/* the school's cover photo — or a calm brand strip with its logo */}
                <div className="relative aspect-[16/9] overflow-hidden bg-brand">
                  {x.coverId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/files/${x.coverId}`} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    x.logoId && (
                      <div className="grid size-full place-items-center">
                        <BrandImage src={`/files/${x.logoId}`} className="size-24 rounded-2xl shadow-lg" />
                      </div>
                    )
                  )}
                </div>
                <div className={cn('relative flex flex-1 flex-col gap-1 px-5 pb-5', (x.logoId && x.coverId) || !x.logoId ? 'pt-10' : 'pt-4')}>
                  {/* logo / photo overlapping the strip (when the strip shows a cover photo) */}
                  <span className="absolute -top-8 start-5">
                    {x.logoId && x.coverId ? (
                      <BrandImage src={`/files/${x.logoId}`} className="size-16 rounded-xl border-4 border-card shadow-sm" />
                    ) : !x.logoId ? (
                      <InitialsAvatar initials={initials(x.name)} color="var(--color-primary)" className="size-16 rounded-xl border-4 border-card text-lg" />
                    ) : null}
                  </span>
                  <h2 className="line-clamp-2 text-lg font-semibold leading-snug">{x.name}</h2>
                  {x.city && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Icon name="pin" className="size-4 flex-none" />
                      {x.city}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/40 px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{s.joinTitle}</h2>
        <p className="max-w-xl text-muted-foreground">{s.joinSub}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">{s.join}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact?topic=school">{s.talk}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
