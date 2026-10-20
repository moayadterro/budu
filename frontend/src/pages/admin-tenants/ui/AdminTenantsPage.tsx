import { requireRole } from '@/entities/session/server'
import { listTenants } from '@/entities/tenant/server'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { ScreenHead } from '@/shared/ui/screen-head'
import { t } from '@/shared/i18n'

const regionName = new Intl.DisplayNames(['en'], { type: 'region' })
const countryName = (code: string) => {
  try {
    return code ? regionName.of(code) ?? code : ''
  } catch {
    return code
  }
}

/** Platform admin: all tenants (IOMAD companies). Live data, admin only. */
export async function AdminTenantsPage() {
  await requireRole('admin')
  const tenants = await listTenants()
  const s = t.admin

  return (
    <>
      <ScreenHead title={s.tenantsTitle} sub={s.tenantsSub} />
      <Card className="overflow-x-auto py-0">
        {tenants.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{s.empty}</p>
        ) : (
          <table className="w-full min-w-[580px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-start text-[11px] font-bold uppercase tracking-[.06em] text-muted-foreground">
                <th className="px-4 py-3 text-start">{s.cols.name}</th>
                <th className="px-4 py-3 text-start">{s.cols.kind}</th>
                <th className="px-4 py-3 text-start">{s.cols.location}</th>
                <th className="px-4 py-3 text-start">{s.cols.status}</th>
                <th className="px-4 py-3 text-end">{s.cols.id}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tn) => (
                <tr key={tn.companyId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{tn.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.kinds[tn.kind]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{[tn.city, countryName(tn.country)].filter(Boolean).join(', ')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tn.suspended ? 'warning' : 'success'}>{tn.suspended ? s.suspended : s.active}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums text-muted-foreground">{tn.companyId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">{s.total(tenants.length)}</p>
    </>
  )
}
