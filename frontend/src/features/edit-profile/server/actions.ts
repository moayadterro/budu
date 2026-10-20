'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, revokeOtherSessions, updateSessionProfile } from '@/entities/session/server'
import { getAccount, setPicture, updateUser } from '@/entities/user/server'
import { ROLES } from '@/shared/config/nav'
import { formFile, formText } from '@/shared/lib/form'
import { passwordOk } from '@/shared/lib/password'
import { defaultInstance, iomadCheckPassword } from '@/shared/server/iomad'
import { NAME_MAX, PHOTO_MAX_BYTES, PHOTO_TYPES, type ProfileError, type ProfileState } from '../model/types'

const saved = (): ProfileState => ({ status: 'saved', at: Date.now() })
const fail = (error: ProfileError): ProfileState => ({ status: 'error', error })
/** Every page shows the user's name/photo (sidebar), so refresh the whole layout. */
const refreshShell = () => revalidatePath('/', 'layout')

/** Uploads a new profile photo to IOMAD (the user's Moodle picture). */
export async function updatePhoto(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireRole(...ROLES)
  const file = formFile(form, 'photo')
  if (!file) return fail('invalid')
  if (!PHOTO_TYPES.includes(file.type)) return fail('notImage')
  if (file.size > PHOTO_MAX_BYTES) return fail('tooBig')
  try {
    const pictureId = await setPicture(user.userId, user.email, file)
    await updateSessionProfile(user.userId, { pictureId })
  } catch (e) {
    console.error('update photo failed', e)
    return fail('server')
  }
  refreshShell()
  return saved()
}

export async function removePhoto() {
  const user = await requireRole(...ROLES)
  await setPicture(user.userId, user.email, null)
  await updateSessionProfile(user.userId, { pictureId: null })
  refreshShell()
}

export async function saveName(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireRole(...ROLES)
  const firstname = formText(form, 'firstName')
  const lastname = formText(form, 'lastName')
  if (!firstname || !lastname) return fail('invalid')
  if (firstname.length > NAME_MAX || lastname.length > NAME_MAX) return fail('tooLong')
  try {
    await updateUser(user.userId, { firstname, lastname })
    await updateSessionProfile(user.userId, { name: `${firstname} ${lastname}` })
  } catch (e) {
    console.error('save name failed', e)
    return fail('server')
  }
  refreshShell()
  return saved()
}

/** Needs the current password (checked by IOMAD, with its lockout); signs out the user's other devices. */
export async function changePassword(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireRole(...ROLES)
  const current = String(form.get('current') ?? '')
  const next = String(form.get('password') ?? '')
  const confirm = String(form.get('confirmPassword') ?? '')
  if (!current || !next || !confirm) return fail('invalid')
  if (!passwordOk(next)) return fail('weak')
  if (next !== confirm) return fail('mismatch')
  try {
    const account = await getAccount(user.email)
    if (!account.found) return fail('server')
    const check = await iomadCheckPassword(defaultInstance(), account.username, current)
    if (!check.ok) return fail(check.reason === 'locked' ? 'locked' : 'wrongPassword')
    await updateUser(user.userId, { password: next })
    await revokeOtherSessions(user.userId)
  } catch (e) {
    console.error('change password failed', e)
    return fail('server')
  }
  return saved()
}
