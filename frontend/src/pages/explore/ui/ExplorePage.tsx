import { CourseCatalog } from '@/widgets/course-catalog'
import { ScreenHead } from '@/shared/ui/screen-head'
import { t } from '@/shared/i18n'

export function ExplorePage() {
  return (
    <>
      <ScreenHead title={t.explore.title} sub={t.explore.sub} />
      <CourseCatalog />
    </>
  )
}
