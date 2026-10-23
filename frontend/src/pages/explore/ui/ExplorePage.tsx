import { requireRole } from '@/entities/session/server'
import { getCurrency } from '@/entities/user/server'
import { CurrencyPicker } from '@/features/switch-currency'
import { CatalogBrowser } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Student: the marketplace (courses teachers listed, priced in the student's currency), with search and filters. */
export async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole('student')
  const t = await getT()
  const currency = await getCurrency(user.userId)
  const items = await catalogFor(user.userId, currency)
  return (
    <>
      <ScreenHead title={t.shop.title} sub={t.shop.sub} />
      <CatalogBrowser items={items} searchParams={await searchParams} hrefBase="/explore" end={<CurrencyPicker value={currency} inline />} />
    </>
  )
}
