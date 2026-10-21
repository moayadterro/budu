import { requireRole } from '@/entities/session/server'
import { getGradeScale, getPublicListing } from '@/entities/tenant/server'
import { SchoolVisibilityForm } from '@/features/school-visibility'
import { GradeScalePicker } from '@/features/set-grade-scale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** School manager: school-wide settings (grade scale). */
export async function SchoolSettingsPage() {
  const user = await requireRole('manager')
  const t = await getT()
  const s = t.school
  const [scale, listing] = await Promise.all([getGradeScale(user.companyId), user.companyId ? getPublicListing(user.companyId) : null])
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <ScreenHead title={s.settingsTitle} sub={s.settingsSub} />
      <Card>
        <CardHeader>
          <CardTitle>{s.gradeScale}</CardTitle>
          <CardDescription>{s.gradeScaleSub}</CardDescription>
        </CardHeader>
        <CardContent>
          <GradeScalePicker current={scale} />
        </CardContent>
      </Card>
      {listing && (
        <Card>
          <CardHeader>
            <CardTitle>{s.visibility.title}</CardTitle>
            <CardDescription>{s.visibility.sub}</CardDescription>
          </CardHeader>
          <CardContent>
            <SchoolVisibilityForm on={listing.on} city={listing.city} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
