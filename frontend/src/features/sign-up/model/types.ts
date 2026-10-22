/** Shared by the form (client) and the server action. No server-only imports here. */
import { passwordOk } from '@/shared/lib/password'
import { splitFullName } from '@/shared/lib/person-name'

export type AccountKind = 'school' | 'teacher' | 'student'
/** student first — the most common sign-up, and the default */
export const ACCOUNT_KINDS: AccountKind[] = ['student', 'teacher', 'school']

export type SignUpInput = {
  kind: AccountKind
  /** one field (owner) — split into first / middle (отчество) / last by `splitFullName` */
  fullName: string
  email: string
  password: string
  /** school only */
  schoolName?: string
  /** school + teacher (their tenant's location) */
  city?: string
  /** ISO 3166-1 alpha-2 */
  country?: string
}

export type SignUpError = 'invalid' | 'fullName' | 'weakPassword' | 'emailTaken' | 'schoolTaken' | 'server'

export type SignUpState =
  | { status: 'idle' }
  | { status: 'error'; error: SignUpError }
  | { status: 'success'; email: string }

export const initialSignUpState: SignUpState = { status: 'idle' }


const filled = (v: unknown) => typeof v === 'string' && v.trim().length > 0
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Returns the first problem, or null when the input is valid. */
export function validate(input: SignUpInput): SignUpError | null {
  if (!['school', 'teacher', 'student'].includes(input.kind)) return 'invalid'
  if (![input.fullName, input.email, input.password].every(filled) || !emailOk(input.email)) return 'invalid'
  if (!splitFullName(input.fullName) || input.fullName.trim().length > 200) return 'fullName'
  if (input.kind === 'school' && (!filled(input.schoolName) || input.schoolName!.trim().length > 100)) return 'invalid'
  if (input.kind !== 'student' && (!filled(input.city) || !/^[A-Z]{2}$/.test(input.country ?? ''))) return 'invalid'
  if (!passwordOk(input.password)) return 'weakPassword'
  return null
}
