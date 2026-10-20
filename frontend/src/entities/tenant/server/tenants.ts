import 'server-only'
import { defaultInstance, iomadCall } from '@/shared/server/iomad'
import { query } from '@/shared/server/db'

/** Tenants = IOMAD companies, plus the kind we recorded at sign-up. SERVER-SIDE ONLY. */

export type TenantKind = 'school' | 'teacher' | 'unknown'
export type Tenant = {
  companyId: number
  name: string
  city: string
  country: string
  suspended: boolean
  kind: TenantKind
}

type Company = { id: number; name: string; city: string; country: string; suspended: number }

export async function listTenants(): Promise<Tenant[]> {
  const iomad = defaultInstance()
  // get_companies needs a criterion; asking for active and suspended covers all of them.
  const companies = (suspended: 0 | 1) =>
    iomadCall<{ companies: Company[] }>(iomad, 'block_iomad_company_admin_get_companies', {
      criteria: [{ key: 'suspended', value: suspended }],
    }).then((r) => r.companies)
  const [active, suspended, kinds] = await Promise.all([
    companies(0),
    companies(1),
    query<{ company_id: number; kind: TenantKind }>(`SELECT company_id, kind FROM tenants WHERE iomad_url = $1`, [iomad.url]),
  ])

  const kindOf = new Map(kinds.map((k) => [k.company_id, k.kind]))
  return [...active, ...suspended]
    .map((c) => ({
      companyId: c.id,
      name: c.name,
      city: c.city,
      country: c.country,
      suspended: !!c.suspended,
      kind: kindOf.get(c.id) ?? 'unknown',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
