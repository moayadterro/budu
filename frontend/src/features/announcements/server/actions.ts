'use server'

import { revalidatePath } from 'next/cache'
import { createAnnouncement, deleteAnnouncement } from '@/entities/announcement/server'
import { schoolParents } from '@/entities/family/server'
import { notify } from '@/entities/notification/server'
import { requireRole } from '@/entities/session/server'
import { getTenantName, isSchool, schoolPeople } from '@/entities/tenant/server'
import { formId, formText } from '@/shared/lib/form'

export type AnnouncementState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: 'invalid' | 'server'; at: number }

/** School manager posts an announcement; students, teachers and their parents are told (bell + email). */
export async function postAnnouncementAction(_prev: AnnouncementState, form: FormData): Promise<AnnouncementState> {
  const user = await requireRole('manager')
  const at = Date.now()
  const title = formText(form, 'title').slice(0, 200)
  const body = formText(form, 'body').slice(0, 4000)
  if (!user.companyId || !title || !(await isSchool(user.companyId))) return { status: 'error', error: 'invalid', at }
  try {
    await createAnnouncement(user.companyId, { id: user.userId, name: user.name }, title, body)
    const [school, people, parents] = await Promise.all([
      getTenantName(user.companyId),
      schoolPeople(user.userId, user.companyId),
      schoolParents(user.companyId),
    ])
    const preview = body.length > 300 ? `${body.slice(0, 300)}…` : body
    await notify(
      [...people.filter((p) => !p.pending), ...parents].filter((p) => p.id !== user.userId),
      'announcement',
      { school: school ?? '', title, body: preview },
      '/',
    )
  } catch (e) {
    console.error('post announcement failed', e)
    return { status: 'error', error: 'server', at }
  }
  revalidatePath('/', 'layout')
  return { status: 'saved', at }
}

export async function deleteAnnouncementAction(form: FormData) {
  const user = await requireRole('manager')
  const id = formId(form, 'announcementId')
  if (!user.companyId || !id) return
  await deleteAnnouncement(user.companyId, id)
  revalidatePath('/', 'layout')
}
