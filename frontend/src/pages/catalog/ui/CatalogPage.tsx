import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { getCurrency, visitorCurrency } from '@/entities/user/server'
import { CatalogGrid } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { getT } from '@/shared/i18n/server'

/** Public: every course in the marketplace — no account needed to look. Students go to Explore. */
export async function CatalogPage() {
  const user = await getSession()
  if (user?.role === 'student') redirect('/explore')
  const t = await getT()
  const items = await catalogFor(user?.userId ?? 0, user ? await getCurrency(user.userId) : await visitorCurrency())
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-2xl bg-brand px-6 py-10 text-primary-foreground sm:px-10">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{t.catalog.heroTitle}</h1>
        <p className="max-w-2xl opacity-90">{t.catalog.heroSub}</p>
      </section>
      <CatalogGrid items={items} hrefBase="/catalog" />
    </div>
  )
}
