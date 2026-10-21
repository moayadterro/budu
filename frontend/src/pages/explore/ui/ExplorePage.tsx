import { requireRole } from '@/entities/session/server'
import { getCurrency } from '@/entities/user/server'
import { CurrencyPicker } from '@/features/switch-currency'
import { CatalogGrid } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Student: the marketplace — courses teachers listed, priced in the student's currency. */
export async function ExplorePage() {
  const user = await requireRole('student')
  const t = await getT()
  const currency = await getCurrency(user.userId)
  const items = await catalogFor(user.userId, currency)
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ScreenHead title={t.shop.title} sub={t.shop.sub} />
        <CurrencyPicker value={currency} inline />
      </div>
      <CatalogGrid items={items} hrefBase="/explore" />
    </>
  )
}
