import 'server-only'
import { splitFullName } from '@/shared/lib/person-name'
import { defaultInstance, iomadCall, IomadInstance } from '@/shared/server/iomad'
import type { SignUpInput } from '../model/types'

/**
 * Creates the IOMAD records for a sign-up. SERVER-SIDE ONLY.
 *   school  → company + manager user (managertype 1)
 *   teacher → their own one-person company + them as manager and educator
 *   student → an independent learner (joins a school later by invite)
 */

export class SignUpConflict extends Error {
  constructor(public code: 'emailTaken' | 'schoolTaken') {
    super(code)
  }
}

/** Moodle usernames allow only a-z 0-9 _ - @ . by default. */
const usernameFor = (email: string) => email.toLowerCase().replace(/[^a-z0-9_\-@.]/g, '_')

/** Unique, readable short name, e.g. "lincoln-online-k3f9". */
function shortName(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'tenant'
  return `${slug}-${Math.random().toString(36).slice(2, 6)}`
}

async function companyExists(iomad: IomadInstance, name: string) {
  const res = await iomadCall<{ companies: unknown[] }>(iomad, 'block_iomad_company_admin_get_companies', {
    criteria: [{ key: 'name', value: name }],
  })
  return res.companies.length > 0
}

export async function createAccount(input: SignUpInput) {
  const iomad = defaultInstance()
  const email = input.email.trim().toLowerCase()
  const username = usernameFor(email)

  // Check first, so we don't leave half-created records behind.
  // (Needs moodle/site:viewuseridentity, else IOMAD hides emails and returns [].)
  for (const [field, value] of [['email', email], ['username', username]]) {
    const existing = await iomadCall<unknown[]>(iomad, 'core_user_get_users_by_field', { field, values: [value] })
    if (existing.length) throw new SignUpConflict('emailTaken')
  }

  // The tenant (IOMAD company) for schools and independent teachers.
  let companyId: number | null = null
  let tenantName = ''
  if (input.kind !== 'student') {
    const n = splitFullName(input.fullName)!
    let name = input.kind === 'school' ? input.schoolName!.trim() : `${n.first} ${n.last}`
    if (await companyExists(iomad, name)) {
      if (input.kind === 'school') throw new SignUpConflict('schoolTaken')
      name = `${name} (${Math.random().toString(36).slice(2, 6)})` // two teachers may share a name
    }
    const [company] = await iomadCall<Array<{ id: number }>>(iomad, 'block_iomad_company_admin_create_companies', {
      companies: [{ name, shortname: shortName(name), city: input.city!.trim(), country: input.country }],
    })
    companyId = company.id
    tenantName = name
  }

  const person = splitFullName(input.fullName)!
  const [user] = await iomadCall<Array<{ id: number }>>(iomad, 'core_user_create_users', {
    users: [
      {
        username,
        auth: 'manual',
        password: input.password,
        firstname: person.first,
        lastname: person.last,
        ...(person.middle ? { middlename: person.middle } : {}), // отчество
        email,
        ...(input.country ? { country: input.country } : {}),
      },
    ],
  })

  if (companyId) {
    // managertype 1 = company manager; teachers also teach (educator)
    await iomadCall(iomad, 'block_iomad_company_admin_assign_users', {
      users: [{ userid: user.id, companyid: companyId, managertype: 1, educator: input.kind === 'teacher' ? 1 : 0 }],
    })
  }

  return { iomadUrl: iomad.url, companyId, userId: user.id, email, tenantName: companyId ? tenantName : null }
}
