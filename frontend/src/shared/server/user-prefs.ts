import 'server-only'
import { defaultInstance, iomadCall } from './iomad'

/**
 * Per-user Budu settings — stored in IOMAD as Moodle user preferences (budu_locale, budu_currency,
 * budu_parent_skipped), so the website and the future mobile API read the same values. Plumbing
 * only (no rules): callers validate values and check who may change them. SERVER-SIDE ONLY.
 */
export type UserPrefs = { locale: string | null; currency: string | null; parentSkipped: boolean }

const NONE: UserPrefs = { locale: null, currency: null, parentSkipped: false }

export async function prefsOf(userIds: number[]): Promise<Map<number, UserPrefs>> {
  const ids = [...new Set(userIds)].filter((id) => Number.isSafeInteger(id) && id > 0)
  if (!ids.length) return new Map()
  const rows = await iomadCall<Array<{ userid: number; locale: string; currency: string; parentskipped: boolean }>>(defaultInstance(), 'local_budu_get_prefs', {
    userids: ids,
  })
  return new Map(rows.map((r) => [r.userid, { locale: r.locale || null, currency: r.currency || null, parentSkipped: r.parentskipped }]))
}

export const prefsOfUser = async (userId: number): Promise<UserPrefs> => (await prefsOf([userId])).get(userId) ?? NONE

export async function setPref(userId: number, name: 'budu_locale' | 'budu_currency' | 'budu_parent_skipped', value: string) {
  await iomadCall(defaultInstance(), 'local_budu_set_pref', { userid: userId, name, value })
}
