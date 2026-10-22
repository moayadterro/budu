import { requireRole } from '@/entities/session/server'
import { getGradeScale } from '@/entities/tenant/server'
import { GradeScalePicker } from '@/features/set-grade-scale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** School manager: school-wide settings (grade scale). */
export async function SchoolSettingsPage() {
  const user = await requireRole('manager')
  const t = await getT()
  const s = t.school
  const scale = await getGradeScale(user.companyId)
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
    </div>
  )
}
