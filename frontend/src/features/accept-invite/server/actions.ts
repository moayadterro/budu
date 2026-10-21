'use server'

import { redirect } from 'next/navigation'
import { updateUser } from '@/entities/user/server'
import { passwordOk } from '@/shared/lib/password'
import { consumeToken, releaseToken } from '@/shared/server/tokens'

export type AcceptState = { status: 'idle' } | { status: 'error'; error: 'invalidLink' | 'mismatch' | 'weakPassword' | 'server' }

/** Invited person chooses a password → account activated in IOMAD → sign in. */
export async function acceptInvite(_prev: AcceptState, form: FormData): Promise<AcceptState> {
  const token = String(form.get('token') ?? '')
  const password = String(form.get('password') ?? '')
  if (password !== String(form.get('confirm') ?? '')) return { status: 'error', error: 'mismatch' }
  if (!passwordOk(password)) return { status: 'error', error: 'weakPassword' }
  const userId = token ? await consumeToken('invite', token) : null
  if (!userId) return { status: 'error', error: 'invalidLink' }
  try {
    await updateUser(userId, { password, suspended: 0 })
  } catch (e) {
    console.error('accept invite failed', e)
    await releaseToken('invite', token)
    return { status: 'error', error: 'server' }
  }
  redirect('/login?invited=1')
}
