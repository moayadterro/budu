'use server'

import { revalidatePath } from 'next/cache'
import { normalizeSlug, slugValid } from '@/entities/school-page'
import { pageOf, setSlug, slugFree } from '@/entities/school-page/server'
import { requireRole } from '@/entities/session/server'
import { isSchool } from '@/entities/tenant/server'

export type SlugCheck = 'ok' | 'invalid' | 'taken'

async function school() {
  const user = await requireRole('manager')
  if (!user.companyId || !(await isSchool(user.companyId))) throw new Error('not a school manager')
  return user.companyId
}

/** Live check while typing the address. */
export async function checkSlugAction(raw: string): Promise<SlugCheck> {
  const companyId = await school()
  const slug = normalizeSlug(String(raw ?? ''))
  if (!slugValid(slug)) return 'invalid'
  return (await slugFree(slug, companyId)) ? 'ok' : 'taken'
}

export type AddressResult = { ok: true; slug: string } | { ok: false; error: SlugCheck | 'server' }

/** Change the page's address (the old link stops working — the form warned and asked first). */
export async function changeSlugAction(raw: string): Promise<AddressResult> {
  try {
    const companyId = await school()
    const slug = normalizeSlug(String(raw ?? ''))
    if (!slugValid(slug)) return { ok: false, error: 'invalid' }
    if (!(await slugFree(slug, companyId)) || !(await setSlug(companyId, slug))) return { ok: false, error: 'taken' }
    revalidatePath('/school', 'layout')
    revalidatePath('/[lang]/schools', 'layout')
    return { ok: true, slug: (await pageOf(companyId))?.slug ?? slug }
  } catch (e) {
    console.error('change school address failed', e)
    return { ok: false, error: 'server' }
  }
}
