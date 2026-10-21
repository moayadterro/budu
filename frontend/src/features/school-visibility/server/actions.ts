'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/entities/session/server'
import { isSchool, setPublicListing } from '@/entities/tenant/server'
import { formText } from '@/shared/lib/form'

export type VisibilityState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; at: number }

/** School manager: show (or hide) the school on Budu's public "Schools on Budu" page. */
export async function saveVisibilityAction(_prev: VisibilityState, form: FormData): Promise<VisibilityState> {
  const user = await requireRole('manager')
  const at = Date.now()
  if (!user.companyId || !(await isSchool(user.companyId))) return { status: 'error', at }
  const city = formText(form, 'city').slice(0, 80)
  await setPublicListing(user.companyId, form.get('public') === 'on', city)
  revalidatePath('/school/settings')
  revalidatePath('/schools')
  return { status: 'saved', at }
}
