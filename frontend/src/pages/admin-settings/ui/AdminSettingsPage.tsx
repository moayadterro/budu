import { requireRole } from '@/entities/session/server'
import { RatesForm } from '@/features/set-exchange-rates'
import { DEFAULT_CURRENCY } from '@/shared/config/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { LocalTime } from '@/shared/ui/local-time'
import { ScreenHead } from '@/shared/ui/screen-head'
import { rateTable } from '@/shared/server/fx'
import { getT } from '@/shared/i18n/server'

/** Platform admin: platform settings — exchange rates (automatic daily, with own overrides). */
export async function AdminSettingsPage() {
  await requireRole('admin')
  const t = await getT()
  const s = t.rates
  const rows = await rateTable()
  const updated = Math.max(0, ...rows.map((r) => r.updatedAt ?? 0))
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <ScreenHead title={t.nav.platformSettings} sub={s.defaultCurrency(DEFAULT_CURRENCY)} />
      <Card>
        <CardHeader>
          <CardTitle>{s.title}</CardTitle>
          <CardDescription>
            {s.sub} {updated > 0 && (
              <>
                {s.updated} <LocalTime seconds={updated} />
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RatesForm rows={rows} />
        </CardContent>
      </Card>
    </div>
  )
}
