import Link from 'next/link'
import { publicSchools } from '@/entities/tenant/server'
import { SchoolCards } from '@/features/browse-schools'
import { Button } from '@/shared/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { PublicHero } from '@/shared/ui/public-hero'
import { getT } from '@/shared/i18n/server'


/** Public: schools that chose to be listed (a manager's switch in Settings — off by default). */
export async function PublicSchoolsPage() {
  const t = await getT()
  const s = t.site.schools
  const first = await publicSchools() // the first page; the rest load on scroll
  return (
    <div className="flex flex-col gap-12">
      <PublicHero title={s.title} sub={s.sub} />
      {first.items.length === 0 ? (
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
        <SchoolCards initial={first.items} next={first.next} />
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
