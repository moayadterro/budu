import type { Role } from '@/shared/config/nav'

export type Membership = { companyid: number; companyname: string; managertype: number; educator: boolean }

/**
 * Budu role from IOMAD memberships, first matching rule wins:
 *   1. IOMAD site administrator                        → admin   (runs the platform)
 *   2. manager of a company registered as a school    → manager (runs a school/company)
 *   3. educator in a company                           → teacher (incl. a solo teacher's own tenant)
 *   4. manager of any other company                    → manager
 *   5. anyone else                                     → student
 * `schoolTenants` = company ids registered as kind 'school' in app-db. Needed because IOMAD flags
 * every company manager as an educator too, so "educator" alone can't tell a school manager from a teacher.
 * New roles get a rule here (most powerful first).
 */
export function roleFor(
  memberships: Membership[],
  siteadmin = false,
  schoolTenants: ReadonlySet<number> = new Set(),
): { role: Role; companyId: number | null } {
  if (siteadmin) return { role: 'admin', companyId: null }
  const runsSchool = memberships.find((m) => m.managertype > 0 && schoolTenants.has(m.companyid))
  if (runsSchool) return { role: 'manager', companyId: runsSchool.companyid }
  const teaching = memberships.find((m) => m.educator)
  if (teaching) return { role: 'teacher', companyId: teaching.companyid }
  const managing = memberships.find((m) => m.managertype > 0)
  if (managing) return { role: 'manager', companyId: managing.companyid }
  return { role: 'student', companyId: memberships[0]?.companyid ?? null }
}
