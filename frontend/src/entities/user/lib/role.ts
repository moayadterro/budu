import type { Role } from '@/shared/config/nav'

export type Membership = { companyid: number; companyname: string; managertype: number; educator: boolean }

/**
 * Budu role from IOMAD, first matching rule wins:
 *   1. IOMAD site administrator          → admin   (runs the platform)
 *   2. educator in a company             → teacher (incl. a solo teacher managing their own tenant)
 *   3. company/department manager        → manager (runs a school/company)
 *   4. anyone else                       → student
 * New roles get a rule here (most powerful first).
 */
export function roleFor(memberships: Membership[], siteadmin = false): { role: Role; companyId: number | null } {
  if (siteadmin) return { role: 'admin', companyId: null }
  const teaching = memberships.find((m) => m.educator)
  if (teaching) return { role: 'teacher', companyId: teaching.companyid }
  const managing = memberships.find((m) => m.managertype > 0)
  if (managing) return { role: 'manager', companyId: managing.companyid }
  return { role: 'student', companyId: memberships[0]?.companyid ?? null }
}
