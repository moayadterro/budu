'use server'

import { redirect } from 'next/navigation'
import { revokeUserSessions } from '@/entities/session/server'
import { getAccount, sendPasswordResetEmail, updateUser } from '@/entities/user/server'
import { consumeToken, issuedRecently, releaseToken } from '@/shared/server/tokens'
import { passwordOk } from '@/shared/lib/password'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

export type ForgotState = { status: 'idle' } | { status: 'sent' }
export type ResetState = { status: 'idle' } | { status: 'error'; error: 'invalidLink' | 'weakPassword' | 'server' }

const text = (form: FormData, k: string) => {
  const v = form.get(k)
  return typeof v === 'string' ? v : ''
}

/** Emails a single-use reset link. Same answer whether or not the account exists. */
export async function requestPasswordReset(_prev: ForgotState, form: FormData): Promise<ForgotState> {
  try {
    const account = await getAccount(text(form, 'email'))
    // Unconfirmed (suspended) accounts confirm their email first; throttle repeats.
    if (account.found && !account.suspended && !(await issuedRecently('reset_password', account.id, 60))) {
      await sendPasswordResetEmail(account)
      audit('passwordResetRequested', { actor: null, target: `user ${account.id}`, details: { email: account.email } })
    }
  } catch (e) {
    reportError('password reset request failed', e)
  }
  return { status: 'sent' }
}

/** A new password for a valid link → IOMAD, then sign out everywhere. */
export async function resetPassword(_prev: ResetState, form: FormData): Promise<ResetState> {
  const token = text(form, 'token')
  const password = text(form, 'password')
  if (!passwordOk(password)) return { status: 'error', error: 'weakPassword' }

  const userId = token ? await consumeToken('reset_password', token) : null
  if (!userId) return { status: 'error', error: 'invalidLink' }
  try {
    await updateUser(userId, { password })
    await revokeUserSessions(userId)
    audit('passwordReset', { actor: null, target: `user ${userId}` })
  } catch (e) {
    reportError('password reset failed', e)
    await releaseToken('reset_password', token) // let them retry with the same link
    return { status: 'error', error: 'server' }
  }
  redirect('/login?reset=1')
}
