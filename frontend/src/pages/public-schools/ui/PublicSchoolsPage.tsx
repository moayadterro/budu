import Link from 'next/link'
import { publicSchools } from '@/entities/tenant/server'
import { BrandImage } from '@/shared/ui/brand-image'
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((x) => (
            <li key={`${x.name}-${x.since}`}>
              {(() => {
                const card = (
                  <>
                    {x.logoId ? (
                      <BrandImage src={`/files/${x.logoId}`} className="size-14 flex-none rounded-xl border" />
                    ) : (
                      <InitialsAvatar initials={initials(x.name)} color="var(--color-primary)" className="size-14 rounded-xl" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{x.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[x.city, s.since(new Date(x.since * 1000).getFullYear())].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {x.slug && <Icon name="chevRight" className="size-4 flex-none text-muted-foreground rtl:-scale-x-100" />}
                  </>
                )
                // a published school page → the card opens it
                return x.slug ? (
                  <Link href={`/schools/${x.slug}`} className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    {card}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 rounded-xl border bg-card p-5">{card}</div>
                )
              })()}
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
