import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance } from '@/shared/server/iomad'
import { roleFor, type Membership } from '../lib/role'

/** roleFor with the school tenants looked up in app-db. SERVER-SIDE ONLY. */
export async function resolveRole(memberships: Membership[], siteadmin: boolean) {
  const ids = memberships.map((m) => m.companyid)
  const rows = ids.length
    ? await query<{ company_id: number }>(
        `SELECT company_id FROM tenants WHERE iomad_url = $1 AND kind = 'school' AND company_id = ANY($2::int[])`,
        [defaultInstance().url, ids],
      )
    : []
  return roleFor(memberships, siteadmin, new Set(rows.map((r) => r.company_id)))
}
