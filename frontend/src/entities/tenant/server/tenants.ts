import 'server-only'
import { defaultInstance, iomadCall } from '@/shared/server/iomad'
import { toPerson, type Person, type RawPerson } from '@/shared/lib/person'
import { query } from '@/shared/server/db'
import { DEFAULT_SCALE, isGradeScale, type GradeScale } from '@/shared/lib/grade-scale'

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

/** The tenant's grade display scale ('percent' when unknown or not a registered tenant). */
export async function getGradeScale(companyId: number | null): Promise<GradeScale> {
  if (!companyId) return DEFAULT_SCALE
  const [row] = await query<{ grade_scale: string }>(`SELECT grade_scale FROM tenants WHERE iomad_url = $1 AND company_id = $2`, [
    defaultInstance().url,
    companyId,
  ])
  return isGradeScale(row?.grade_scale) ? row.grade_scale : DEFAULT_SCALE
}

export async function setGradeScale(companyId: number, scale: GradeScale) {
  await query(`UPDATE tenants SET grade_scale = $3 WHERE iomad_url = $1 AND company_id = $2`, [defaultInstance().url, companyId, scale])
}

/** The tenant's display name as registered in app-db (null if not registered). */
export async function getTenantName(companyId: number | null): Promise<string | null> {
  if (!companyId) return null
  const [row] = await query<{ name: string }>(`SELECT name FROM tenants WHERE iomad_url = $1 AND company_id = $2`, [
    defaultInstance().url,
    companyId,
  ])
  return row?.name ?? null
}

// ----- school (company) people & courses, for managers -----

export type SchoolRole = 'manager' | 'teacher' | 'student'
export type SchoolPerson = Person & { role: SchoolRole; pending: boolean }
export type SchoolCourse = {
  id: number
  title: string
  published: boolean
  teachers: string
  students: number
  lessons: number
  homework: number
}

/** Everyone in the school with their role; `pending` = invited, not activated yet. */
export async function schoolPeople(userId: number, companyId: number): Promise<SchoolPerson[]> {
  const rows = await iomadCall<Array<RawPerson & { role: SchoolRole; suspended: boolean }>>(defaultInstance(), 'local_budu_company_people', {
    companyid: companyId,
    userid: userId,
  })
  return rows.map((r) => ({ ...toPerson(r), role: r.role, pending: r.suspended }))
}

export async function schoolCourses(userId: number, companyId: number): Promise<SchoolCourse[]> {
  const rows = await iomadCall<
    Array<{ id: number; fullname: string; visible: boolean; teachers: string; students: number; lessons: number; homework: number }>
  >(defaultInstance(), 'local_budu_company_courses', { companyid: companyId, userid: userId })
  return rows.map((c) => ({
    id: c.id,
    title: c.fullname,
    published: c.visible,
    teachers: c.teachers,
    students: c.students,
    lessons: c.lessons,
    homework: c.homework,
  }))
}

/** Adds (or updates) a user in the school: teacher = educator, manager = company manager, student = plain member. */
export async function addToSchool(companyId: number, userId: number, role: SchoolRole) {
  await iomadCall(defaultInstance(), 'block_iomad_company_admin_assign_users', {
    users: [{ userid: userId, companyid: companyId, managertype: role === 'manager' ? 1 : 0, educator: role === 'teacher' ? 1 : 0 }],
  })
}

/** Changes someone's role in the school (IOMAD flags; plugin checks the acting manager). */
export async function setSchoolRole(managerId: number, companyId: number, userId: number, role: SchoolRole) {
  await iomadCall(defaultInstance(), 'local_budu_set_role', { companyid: companyId, userid: managerId, targetid: userId, role })
}

/** Is this company registered as a school (vs. a solo teacher's own tenant / none)? */
export async function isSchool(companyId: number | null): Promise<boolean> {
  if (!companyId) return false
  const [row] = await query<{ kind: string }>(`SELECT kind FROM tenants WHERE iomad_url = $1 AND company_id = $2`, [
    defaultInstance().url,
    companyId,
  ])
  return row?.kind === 'school'
}
