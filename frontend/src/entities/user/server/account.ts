import 'server-only'
import { defaultInstance, iomadCall, iomadUpload, IomadError } from '@/shared/server/iomad'
import type { Membership } from '../lib/role'

/** IOMAD user account access. SERVER-SIDE ONLY. */

export type Account =
  | {
      found: true
      id: number
      username: string
      firstname: string
      lastname: string
      email: string
      suspended: boolean
      /** IOMAD site administrator */
      siteadmin: boolean
      /** profile picture file id, 0 = none */
      picture: number
      memberships: Membership[]
    }
  | { found: false; memberships: [] }

/** By email (case-insensitive), via the local_budu plugin. */
export function getAccount(email: string) {
  return iomadCall<Account>(defaultInstance(), 'local_budu_get_account', { email: email.trim() })
}

/** suspended=1 blocks sign-in in IOMAD (used until the email is confirmed). */
export async function updateUser(
  id: number,
  fields: { suspended?: 0 | 1; password?: string; firstname?: string; lastname?: string },
) {
  const res = await iomadCall<{ warnings?: Array<{ message: string }> }>(defaultInstance(), 'core_user_update_users', {
    users: [{ id, ...fields }],
  })
  if (res?.warnings?.length) throw new IomadError('warning', `IOMAD update_users: ${res.warnings[0].message}`)
}

/** Sets (file) or removes (null) the user's IOMAD profile picture. Returns the new picture file id, or null. */
export async function setPicture(id: number, email: string, file: File | null): Promise<number | null> {
  const iomad = defaultInstance()
  const draft = file ? await iomadUpload(iomad, file) : 0
  await iomadCall(iomad, 'core_user_update_picture', { draftitemid: draft, delete: file ? 0 : 1, userid: id })
  const account = await getAccount(email)
  return account.found && account.picture ? account.picture : null
}
