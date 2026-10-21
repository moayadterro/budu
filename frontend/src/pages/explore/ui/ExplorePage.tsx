import { requireRole } from '@/entities/session/server'
import { getCurrency } from '@/entities/user/server'
import { CatalogGrid } from '@/widgets/course-catalog'
import { catalogFor } from '@/widgets/course-catalog/server'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Student: the marketplace — courses teachers listed, priced in the student's currency. */
export async function ExplorePage() {
  const user = await requireRole('student')
  const t = await getT()
  const items = await catalogFor(user.userId, await getCurrency(user.userId))
  return (
    <>
      <ScreenHead title={t.shop.title} sub={t.shop.sub} />
      <CatalogGrid items={items} hrefBase="/explore" />
    </>
  )
}
