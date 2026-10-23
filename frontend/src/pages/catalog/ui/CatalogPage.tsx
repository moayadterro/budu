import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { getCurrency, visitorCurrency } from '@/entities/user/server'
import { CurrencyPicker } from '@/features/switch-currency'
import { CatalogBrowser } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { SchoolInvite } from '@/widgets/school-invite'
import { getT } from '@/shared/i18n/server'

/** Public: every course in the marketplace, with search and filters. No account needed to look. Students go to Explore. */
export async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getSession()
  if (user?.role === 'student') redirect('/explore')
  const t = await getT()
  const currency = user ? await getCurrency(user.userId) : await visitorCurrency()
  const items = await catalogFor(user?.userId ?? 0, currency)
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-2xl bg-brand px-6 py-10 text-primary-foreground sm:px-10">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{t.catalog.heroTitle}</h1>
        <p className="max-w-2xl opacity-90">{t.catalog.heroSub}</p>
      </section>
      <CatalogBrowser items={items} searchParams={await searchParams} hrefBase="/catalog" end={<CurrencyPicker value={currency} inline />} />
      {/* our own banner after the courses, for everyone (owner) */}
      <SchoolInvite className="mt-12 sm:mt-20" />
    </div>
  )
}
