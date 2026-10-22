'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/entities/session/server'
import { isSchool, setSchoolLocation } from '@/entities/tenant/server'
import { isCountry } from '@/shared/config/countries'
import { formText } from '@/shared/lib/form'

export type LocationState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; at: number }

/** The school's city and country (school managers only). */
export async function saveLocationAction(_prev: LocationState, form: FormData): Promise<LocationState> {
  const at = Date.now()
  const user = await requireRole('manager')
  if (!user.companyId || !(await isSchool(user.companyId))) return { status: 'error', at }
  const country = formText(form, 'country').toUpperCase()
  try {
    await setSchoolLocation(user.userId, user.companyId, formText(form, 'city').slice(0, 120), isCountry(country) ? country : '')
    revalidatePath('/school', 'layout')
    revalidatePath('/[lang]/schools', 'layout')
    return { status: 'saved', at }
  } catch (e) {
    console.error('save school location failed', e)
    return { status: 'error', at }
  }
}
