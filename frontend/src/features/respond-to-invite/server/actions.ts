'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notify } from '@/entities/notification/server'
import { answerInvite, cancelInvite } from '@/entities/tenant/server'
import { getUserById } from '@/entities/user/server'
import { formId } from '@/shared/lib/form'
import { getSession, refreshSessionsOf, requireRole } from '@/entities/session/server'
import { answerParentRequest } from '@/entities/family/server'
import { audit } from '@/shared/server/audit'

/** The invited person accepts or declines; the inviting manager is told. Accept → their new home. */
export async function answerInviteAction(form: FormData) {
  const user = await getSession()
  if (!user) redirect('/login')
  const inviteId = formId(form, 'inviteId')
  const accept = form.get('answer') === 'accept'
  if (!inviteId) return
  const invite = await answerInvite(user.userId, inviteId, accept)
  if (!invite) return
  audit(accept ? 'schoolInviteAccepted' : 'schoolInviteDeclined', { target: `invite ${inviteId}`, details: { school: invite.school, role: invite.role } })
  if (invite.invitedById) {
    const manager = await getUserById(invite.invitedById)
    if (manager) {
      await notify(
        [manager],
        'inviteAnswered',
        { name: user.name, school: invite.school, role: invite.role, answer: accept ? 'accepted' : 'declined' },
        '/school/people',
      )
    }
  }
  revalidatePath('/', 'layout')
  if (accept) redirect('/start') // role / school may have changed: land on the (new) home
}

/** Manager withdraws a pending invitation. */
export async function cancelInviteAction(form: FormData) {
  const user = await requireRole('manager')
  const inviteId = formId(form, 'inviteId')
  if (!inviteId || !user.companyId) return
  await cancelInvite(user.companyId, inviteId)
  audit('schoolInviteCancelled', { target: `invite ${inviteId}` })
  revalidatePath('/', 'layout')
}

/** A parent accepts or declines a child's request; the child is told. Accept → their (parent) home. */
export async function answerParentRequestAction(form: FormData) {
  const user = await getSession()
  if (!user) redirect('/login')
  const requestId = formId(form, 'requestId')
  const accept = form.get('answer') === 'accept'
  if (!requestId) return
  const answered = await answerParentRequest(user.userId, requestId, accept)
  if (answered) audit(accept ? 'parentRequestAccepted' : 'parentRequestDeclined', { target: `request ${requestId}` })
  if (!answered) return
  const child = await getUserById(answered.childId)
  if (child) await notify([child], 'parentAnswered', { parent: user.name, answer: accept ? 'accepted' : 'declined' }, '/account')
  if (accept) await refreshSessionsOf(user.userId) // may become a parent now
  revalidatePath('/', 'layout')
  if (accept) redirect('/start')
}
