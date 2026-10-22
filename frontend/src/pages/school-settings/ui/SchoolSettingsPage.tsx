import { requireRole } from '@/entities/session/server'
import { getGradeScale, isSchool, schoolsInfo } from '@/entities/tenant/server'
import { LocationForm } from '@/features/edit-school-location'
import { AddressForm } from '@/features/change-school-address'
import { ensureSlug, pageOf } from '@/entities/school-page/server'
import { appUrl } from '@/shared/server/mailer'
import { GradeScalePicker } from '@/features/set-grade-scale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** School manager: school-wide settings (location, the page's address, grade scale). */
export async function SchoolSettingsPage() {
  const user = await requireRole('manager')
  const t = await getT()
  const s = t.school
  const [scale, info, school] = await Promise.all([
    getGradeScale(user.companyId),
    schoolsInfo(user.companyId ? [user.companyId] : []),
    user.companyId ? isSchool(user.companyId) : false,
  ])
  const place = user.companyId ? info.get(user.companyId) : undefined
  const page = school && user.companyId ? await pageOf(user.companyId) : null
  const slug = page && user.companyId ? (page.slug ?? (await ensureSlug(user.companyId, page.name))) : null
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <ScreenHead title={s.settingsTitle} sub={s.settingsSub} />
      {school && place && (
        <Card>
          <CardHeader>
            <CardTitle>{s.location}</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationForm city={place.city} country={place.country} />
          </CardContent>
        </Card>
      )}
      {slug && (
        <Card id="address" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>{s.address}</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressForm slug={slug} origin={appUrl('/').replace(/\/$/, '')} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{s.gradeScale}</CardTitle>
          <CardDescription>{s.gradeScaleSub}</CardDescription>
        </CardHeader>
        <CardContent>
          <GradeScalePicker current={scale} />
        </CardContent>
      </Card>
    </div>
  )
}
