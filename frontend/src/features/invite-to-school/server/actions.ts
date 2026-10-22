'use server'

import { revalidatePath } from 'next/cache'
import { notify } from '@/entities/notification/server'
import { requireRole } from '@/entities/session/server'
import { addToSchool, createInvite, getTenantName, schoolPeople, setSchoolRole, type SchoolRole } from '@/entities/tenant/server'
import { createInvitedUser, getAccount } from '@/entities/user/server'
import { formText } from '@/shared/lib/form'
import { dirOf } from '@/shared/i18n'
import { getLocale, getT } from '@/shared/i18n/server'
import { composeMail } from '@/shared/server/mail-layout'
import { appUrl, sendMail } from '@/shared/server/mailer'
import { issueToken } from '@/shared/server/tokens'

export type InviteState = { status: 'idle' } | { status: 'created' | 'invited' | 'pending' | 'already' | 'invalid' | 'server'; at: number }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES: SchoolRole[] = ['teacher', 'student', 'manager']
const INVITE_DAYS = 7

/**
 * Manager invites someone into their school. Existing Budu account → a pending invitation they must
 * accept (bell + email); they join only then. New person → a suspended account in IOMAD added to the
 * school, and an emailed link to choose a password (choosing it = accepting).
 */
export async function inviteToSchool(_prev: InviteState, form: FormData): Promise<InviteState> {
  const user = await requireRole('manager')
  const at = Date.now()
  const email = formText(form, 'email').toLowerCase()
  const firstname = formText(form, 'firstName').slice(0, 100)
  const lastname = formText(form, 'lastName').slice(0, 100)
  const role = formText(form, 'role') as SchoolRole
  if (!user.companyId || !EMAIL.test(email) || !firstname || !lastname || !ROLES.includes(role)) return { status: 'invalid', at }

  try {
    const school = (await getTenantName(user.companyId)) ?? ''
    const account = await getAccount(email)
    if (account.found) {
      const people = await schoolPeople(user.userId, user.companyId)
      if (people.some((p) => p.id === account.id)) return { status: 'already', at }
      const created = await createInvite(user.companyId, account.id, role, { id: user.userId, name: user.name })
      if (!created) return { status: 'pending', at }
      await notify(
        [{ id: account.id, email: account.email, name: `${account.firstname} ${account.lastname}`.trim() }],
        'schoolInvite',
        { school, by: user.name, role },
        '/invites',
      )
      revalidatePath('/', 'layout')
      return { status: 'invited', at }
    }

    const id = await createInvitedUser({ email, firstname, lastname })
    await addToSchool(user.companyId, id, role)
    const token = await issueToken('invite', id, INVITE_DAYS * 24 * 60)
    const t = await getT() // the person has no language yet: use the inviting manager's
    await sendMail({
      to: email,
      subject: t.email.invite.subject(school),
      ...composeMail(t, dirOf(await getLocale()), {
        title: t.email.invite.subject(school),
        name: firstname,
        body: t.email.invite.body({ school, by: user.name, role: t.role[role] }),
        action: t.email.invite.action,
        link: appUrl(`/accept-invite?token=${token}`),
      }),
    })
    revalidatePath('/', 'layout')
    return { status: 'created', at }
  } catch (e) {
    console.error('invite failed', e)
    return { status: 'server', at }
  }
}

/** Manager changes someone's role in the school (not their own). */
export async function changeSchoolRole(userId: number, role: SchoolRole) {
  const user = await requireRole('manager')
  if (!user.companyId || !ROLES.includes(role) || !Number.isSafeInteger(userId) || userId === user.userId) return
  const people = await schoolPeople(user.userId, user.companyId)
  if (!people.some((p) => p.id === userId)) return
  await setSchoolRole(user.userId, user.companyId, userId, role)
  revalidatePath('/', 'layout')
}
