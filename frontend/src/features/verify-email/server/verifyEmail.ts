import 'server-only'
import { updateUser } from '@/entities/user/server'
import { consumeToken, releaseToken } from '@/shared/server/tokens'

/** Confirms an email link: un-suspends the IOMAD account so it can sign in. SERVER-SIDE ONLY. */
export async function verifyEmail(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const userId = await consumeToken('verify_email', token)
  if (!userId) return false
  try {
    await updateUser(userId, { suspended: 0 })
    return true
  } catch (e) {
    console.error('email verification failed', e)
    await releaseToken('verify_email', token)
    return false
  }
}
