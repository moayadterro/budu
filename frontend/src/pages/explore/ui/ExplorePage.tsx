import { CourseCatalog } from '@/widgets/course-catalog'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

export async function ExplorePage() {
  const t = await getT()
  return (
    <>
      <ScreenHead title={t.explore.title} sub={t.explore.sub} />
      <CourseCatalog />
    </>
  )
}
