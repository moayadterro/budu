'use server'

import { publicSchools } from '@/entities/tenant/server'

/** The next page of "Schools on Budu" (public — only published school pages; nothing private). */
export async function moreSchoolsAction(after: string) {
  if (typeof after !== 'string' || after.length > 64) return { items: [], next: null }
  return publicSchools(after)
}
