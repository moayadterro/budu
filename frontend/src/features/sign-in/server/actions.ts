'use server'

import { redirect } from 'next/navigation'
import { createSession } from '@/entities/session/server'
import { getAccount, roleFor, sendVerificationEmail } from '@/entities/user/server'
import { defaultInstance, iomadCheckPassword } from '@/shared/server/iomad'
import { hasPendingToken, issuedRecently } from '@/shared/server/tokens'
import { homeFor } from '@/shared/config/nav'
import { safeNext } from '@/shared/lib/password'

export type SignInState =
  | { status: 'idle' }
  | { status: 'error'; error: 'invalid' | 'locked' | 'server' }
  | { status: 'notVerified'; email: string }
  | { status: 'resent' }

const text = (form: FormData, k: string) => {
  const v = form.get(k)
  return typeof v === 'string' ? v : ''
}

/** Email + password → IOMAD checks the password (local_budu) → session cookie → the role's home. */
export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = text(form, 'email').trim()
  const password = text(form, 'password')
  if (!email || !password) return { status: 'error', error: 'invalid' }

  let destination: string
  try {
    const account = await getAccount(email)
    if (!account.found) return { status: 'error', error: 'invalid' }
    if (account.suspended) {
      // Suspended + pending confirmation link = never confirmed; anything else stays generic.
      return (await hasPendingToken('verify_email', account.id))
        ? { status: 'notVerified', email: account.email }
        : { status: 'error', error: 'invalid' }
    }
    const check = await iomadCheckPassword(defaultInstance(), account.username, password)
    if (!check.ok) return { status: 'error', error: check.reason === 'locked' ? 'locked' : 'invalid' }
    const { role, companyId } = roleFor(account.memberships, account.siteadmin)
    await createSession({
      userId: account.id,
      role,
      companyId,
      name: `${account.firstname} ${account.lastname}`.trim(),
      email: account.email,
      pictureId: account.picture || null,
    })
    destination = safeNext(form.get('next')) ?? homeFor(role)
  } catch (e) {
    console.error('sign-in failed', e)
    return { status: 'error', error: 'server' }
  }
  redirect(destination) // outside try: redirect() works by throwing
}

/** Re-sends the confirmation link (throttled; same answer whether or not the account exists). */
export async function resendVerification(_prev: SignInState, form: FormData): Promise<SignInState> {
  try {
    const account = await getAccount(text(form, 'email'))
    if (
      account.found &&
      account.suspended &&
      (await hasPendingToken('verify_email', account.id)) &&
      !(await issuedRecently('verify_email', account.id, 60))
    ) {
      await sendVerificationEmail(account)
    }
  } catch (e) {
    console.error('resend verification failed', e)
  }
  return { status: 'resent' }
}
