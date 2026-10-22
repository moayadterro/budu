'use server'

import { revalidatePath } from 'next/cache'
import { BLOCK_KINDS, PAGE_LIMITS, type BlockData, type BlockKind } from '@/entities/school-page'
import { addBlock, deleteBlock, memberPhoto, moveBlock, pageOf, saveBlock, savePhoto, setCover, setPublished, setTagline } from '@/entities/school-page/server'
import { requireRole } from '@/entities/session/server'
import { isSchool, schoolPeople, setSchoolLogo } from '@/entities/tenant/server'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

/** The signed-in manager's school (only schools have a public page). */
async function school() {
  return (await manager()).companyId
}

async function manager() {
  const user = await requireRole('manager')
  if (!user.companyId || !(await isSchool(user.companyId))) throw new Error('not a school manager')
  return { userId: user.userId, companyId: user.companyId }
}

const refresh = async (companyId: number) => {
  revalidatePath('/school/page')
  const page = await pageOf(companyId)
  // public pages live under /[lang] (every language version at once)
  if (page?.slug) revalidatePath('/[lang]/schools/[slug]', 'page')
  revalidatePath('/[lang]/schools', 'page')
}

/** The line under the school's name (saved on its own, right in the profile header). */
export async function setTaglineAction(tagline: string): Promise<boolean> {
  const companyId = await school()
  await setTagline(companyId, String(tagline ?? '').trim().slice(0, PAGE_LIMITS.tagline))
  await refresh(companyId)
  return true
}

/** Publish (the page goes on the internet and into "Schools on Budu") or take it down. */
export async function setPublishedAction(published: boolean): Promise<void> {
  const companyId = await school()
  const page = await pageOf(companyId)
  if (!page?.slug) return // every school gets an address when it opens the editor
  await setPublished(companyId, published === true)
  audit(published === true ? 'schoolPagePublished' : 'schoolPageUnpublished', { details: { username: page.slug } })
  await refresh(companyId)
}

export async function addBlockAction(kind: string): Promise<number | null> {
  const companyId = await school()
  if (!BLOCK_KINDS.includes(kind as BlockKind)) return null
  const id = await addBlock(companyId, kind as BlockKind)
  await refresh(companyId)
  return id
}

/** A block's content as JSON (shape and lengths are cleaned on the server). */
export async function saveBlockAction(id: number, json: string): Promise<boolean> {
  const { userId, companyId } = await manager()
  if (!Number.isSafeInteger(id) || json.length > 100_000) return false
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return false
  }
  const ok = await saveBlock(companyId, id, data, async (block, before) =>
    block.kind === 'top' ? withPhotos(userId, companyId, block.data as BlockData['top'], before.data as BlockData['top']) : block.data,
  )
  await refresh(companyId)
  return ok
}

/**
 * Top students who are members of the school (their name matches exactly one) get their profile
 * photo on the page. The copy is made once per picture: kept while they keep the same photo.
 * Never trusts ids from the browser — everything is worked out from the names.
 */
async function withPhotos(userId: number, companyId: number, top: BlockData['top'], before: BlockData['top']): Promise<BlockData['top']> {
  const people = (await schoolPeople(userId, companyId).catch(() => [])).filter((p) => !p.pending)
  const key = (name: string) => name.trim().toLocaleLowerCase()
  const items = await Promise.all(
    top.items.map(async (it) => {
      const same = people.filter((p) => key(p.name) === key(it.name))
      const member = same.length === 1 ? same[0]! : null
      if (!member?.pictureId) return { ...it, userId: member?.id ?? null, fileId: null, fromPicture: null }
      const kept = before.items.find((b) => b.userId === member.id && b.fromPicture === member.pictureId && b.fileId)
      const fileId = kept ? kept.fileId : await memberPhoto(userId, companyId, member.id).catch(() => null)
      return { ...it, userId: member.id, fileId, fromPicture: fileId ? member.pictureId : null }
    }),
  )
  return { ...top, items }
}

export async function moveBlockAction(id: number, dir: number) {
  const companyId = await school()
  if (!Number.isSafeInteger(id)) return
  await moveBlock(companyId, id, dir < 0 ? -1 : 1)
  await refresh(companyId)
}

export async function deleteBlockAction(id: number) {
  const companyId = await school()
  if (!Number.isSafeInteger(id)) return
  await deleteBlock(companyId, id)
  await refresh(companyId)
}

const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const PHOTO_MAX = 8 * 1024 * 1024

export type PhotoResult = { ok: true; id: number } | { ok: false; error: 'type' | 'size' | 'server' }

/** Upload one photo for the page (cover, gallery, news, spotlight). Stored in IOMAD, public. */
export async function uploadPhotoAction(form: FormData): Promise<PhotoResult> {
  const { userId, companyId } = await manager()
  const file = form.get('photo')
  if (!(file instanceof File) || !PHOTO_TYPES.includes(file.type)) return { ok: false, error: 'type' }
  if (file.size > PHOTO_MAX) return { ok: false, error: 'size' }
  try {
    return { ok: true, id: await savePhoto(userId, companyId, file) }
  } catch (e) {
    reportError('school photo upload failed', e)
    return { ok: false, error: 'server' }
  }
}

/** The hero's cover photo (null = remove). */
export async function setCoverAction(fileId: number | null) {
  const companyId = await school()
  await setCover(companyId, fileId && Number.isSafeInteger(fileId) ? fileId : null)
  await refresh(companyId)
}

/** The school's logo (IOMAD's company logo — the same one IOMAD shows). No file = remove it. */
export async function setLogoAction(form: FormData): Promise<PhotoResult> {
  const { userId, companyId } = await manager()
  const file = form.get('photo')
  if (file !== null && !(file instanceof File && PHOTO_TYPES.includes(file.type))) return { ok: false, error: 'type' }
  if (file instanceof File && file.size > PHOTO_MAX) return { ok: false, error: 'size' }
  try {
    const id = await setSchoolLogo(userId, companyId, file instanceof File ? file : null)
    await refresh(companyId)
    return { ok: true, id: id ?? 0 }
  } catch (e) {
    reportError('school logo failed', e)
    return { ok: false, error: 'server' }
  }
}
