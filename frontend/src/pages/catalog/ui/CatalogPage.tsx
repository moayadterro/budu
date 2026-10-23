import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { getCurrency, visitorCurrency } from '@/entities/user/server'
import { CurrencyPicker } from '@/features/switch-currency'
import { CatalogGrid } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { SchoolInvite } from '@/widgets/school-invite'
import { getT } from '@/shared/i18n/server'

/** Public: every course in the marketplace — no account needed to look. Students go to Explore. */
export async function CatalogPage() {
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
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <CurrencyPicker value={currency} inline />
        </div>
        <CatalogGrid items={items} hrefBase="/catalog" />
      </div>
      {/* our own banner after the courses, for everyone (owner) */}
      <SchoolInvite className="mt-12 sm:mt-20" />
    </div>
  )
}
