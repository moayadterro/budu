'use server'

import { updateUser, sendVerificationEmail } from '@/entities/user/server'
import { query } from '@/shared/server/db'
import { splitFullName } from '@/shared/lib/person-name'
import { createAccount, SignUpConflict } from './createAccount'
import { AccountKind, SignUpInput, SignUpState, validate } from '../model/types'

/** Server action behind the sign-up form (school, teacher or student). */
export async function signUp(_prev: SignUpState, form: FormData): Promise<SignUpState> {
  const get = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' ? v : undefined
  }
  const input: SignUpInput = {
    kind: get('kind') as AccountKind,
    fullName: get('fullName') ?? '',
    email: get('email') ?? '',
    password: get('password') ?? '',
    schoolName: get('schoolName'),
    city: get('city'),
    country: get('country'),
  }

  const problem = validate(input)
  if (problem) return { status: 'error', error: problem }

  try {
    const created = await createAccount(input)
    // Blocked in IOMAD until the email link is clicked (features/verify-email).
    await updateUser(created.userId, { suspended: 1 })
    if (created.companyId) {
      await query(
        `INSERT INTO tenants (iomad_url, company_id, kind, name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [created.iomadUrl, created.companyId, input.kind, created.tenantName],
      )
    }
    await sendVerificationEmail({ id: created.userId, email: created.email, firstname: splitFullName(input.fullName)!.first })
    return { status: 'success', email: created.email }
  } catch (e) {
    if (e instanceof SignUpConflict) return { status: 'error', error: e.code }
    console.error('sign-up failed', e)
    return { status: 'error', error: 'server' }
  }
}
