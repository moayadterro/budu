'use server'

import { redirect } from 'next/navigation'
import { acceptAllFor } from '@/entities/family/server'
import { notify } from '@/entities/notification/server'
import { getUserById, updateUser } from '@/entities/user/server'
import { passwordOk } from '@/shared/lib/password'
import { consumeToken, releaseToken } from '@/shared/server/tokens'

export type AcceptState = { status: 'idle' } | { status: 'error'; error: 'invalidLink' | 'weakPassword' | 'server' }

/**
 * Invited person chooses a password → account activated in IOMAD → sign in. A parent invited by a
 * child accepts that way too: their pending parent requests are accepted and the children told.
 */
export async function acceptInvite(_prev: AcceptState, form: FormData): Promise<AcceptState> {
  const token = String(form.get('token') ?? '')
  const password = String(form.get('password') ?? '')
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
  try {
    const children = await acceptAllFor(userId)
    if (children.length) {
      const parent = await getUserById(userId)
      const kids = (await Promise.all(children.map(getUserById))).filter((k) => k !== null)
      await notify(kids, 'parentAnswered', { parent: parent?.name ?? '', answer: 'accepted' }, '/account')
    }
  } catch (e) {
    console.error('linking the invited parent failed', e) // the account is active; the child can ask again
  }
  redirect('/login?invited=1')
}
