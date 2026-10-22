'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cancelParentRequest, createParentRequest, getFamily, skipParentPrompt, unlinkParent } from '@/entities/family/server'
import { notify } from '@/entities/notification/server'
import { refreshSessionsOf, requireRole } from '@/entities/session/server'
import { createInvitedUser, getAccount } from '@/entities/user/server'
import { formId, formText } from '@/shared/lib/form'
import { dirOf } from '@/shared/i18n'
import { getLocale, getT } from '@/shared/i18n/server'
import { composeMail } from '@/shared/server/mail-layout'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { issueToken } from '@/shared/server/tokens'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

export type AddParentState =
  | { status: 'idle' }
  | { status: 'sent'; email: string; at: number }
  | { status: 'error'; error: 'invalid' | 'self' | 'pending' | 'already' | 'server'; at: number }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INVITE_DAYS = 7

/**
 * A student asks someone to be their parent. Existing account → a pending request they accept in the
 * app (bell + email). No account → a suspended account + an emailed link; choosing a password accepts.
 */
export async function addParentAction(_prev: AddParentState, form: FormData): Promise<AddParentState> {
  const user = await requireRole('student')
  const at = Date.now()
  const email = formText(form, 'email').toLowerCase()
  const firstname = formText(form, 'firstName').slice(0, 100)
  const lastname = formText(form, 'lastName').slice(0, 100)
  if (!EMAIL.test(email) || !firstname || !lastname) return { status: 'error', error: 'invalid', at }
  if (email === user.email.toLowerCase()) return { status: 'error', error: 'self', at }

  try {
    const account = await getAccount(email)
    if (account.found) {
      const { parents } = await getFamily(user.userId)
      if (parents.some((p) => p.id === account.id)) return { status: 'error', error: 'already', at }
      if (!(await createParentRequest(user.userId, account.id))) return { status: 'error', error: 'pending', at }
      audit('parentRequested', { target: `user ${account.id}`, details: { email, existing: true } })
      await notify(
        [{ id: account.id, email: account.email, name: `${account.firstname} ${account.lastname}`.trim() }],
        'parentRequest',
        { child: user.name },
        '/invites',
      )
    } else {
      const id = await createInvitedUser({ email, firstname, lastname })
      await createParentRequest(user.userId, id)
      audit('parentRequested', { target: `user ${id}`, details: { email, existing: false } })
      const token = await issueToken('invite', id, INVITE_DAYS * 24 * 60)
      const t = await getT() // the parent has no language yet: use the child's
      await sendMail({
        to: email,
        subject: t.email.parentInvite.subject(user.name),
        ...composeMail(t, dirOf(await getLocale()), {
          title: t.email.parentInvite.subject(user.name),
          name: firstname,
          body: t.email.parentInvite.body(user.name),
          action: t.email.parentInvite.action,
          link: appUrl(`/accept-invite?token=${token}`),
        }),
      })
    }
  } catch (e) {
    reportError('add parent failed', e)
    return { status: 'error', error: 'server', at }
  }
  revalidatePath('/', 'layout')
  return { status: 'sent', email, at }
}

/** "Skip for now" on the step after sign-up. */
export async function skipParentStepAction() {
  const user = await requireRole('student')
  await skipParentPrompt(user.userId)
  redirect('/home')
}

/** The student withdraws a request they sent. */
export async function cancelParentRequestAction(form: FormData) {
  const user = await requireRole('student')
  const id = formId(form, 'requestId')
  if (!id) return
  await cancelParentRequest(user.userId, id)
  audit('parentRequestCancelled', { target: `request ${id}` })
  revalidatePath('/', 'layout')
}

/** The student removes a linked parent. */
export async function removeParentAction(form: FormData) {
  const user = await requireRole('student')
  const parentId = formId(form, 'parentId')
  if (!parentId) return
  const { parents } = await getFamily(user.userId)
  if (!parents.some((p) => p.id === parentId)) return
  await unlinkParent(parentId, user.userId)
  audit('parentRemoved', { target: `user ${parentId}` })
  await refreshSessionsOf(parentId) // their role may change (no children left)
  revalidatePath('/', 'layout')
}
