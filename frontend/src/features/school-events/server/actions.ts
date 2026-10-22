'use server'

import { revalidatePath } from 'next/cache'
import { notify } from '@/entities/notification/server'
import { addSchoolEvent, deleteSchoolEvent } from '@/entities/schedule/server'
import { requireRole } from '@/entities/session/server'
import { getTenantName, schoolPeople } from '@/entities/tenant/server'
import { formId, formText } from '@/shared/lib/form'
import { reportError } from '@/shared/server/errors'

export type EventState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: 'invalid' | 'server' }

/** Manager adds a school event (start/duration computed in the browser); everyone in the school is told. */
export async function addSchoolEventAction(_prev: EventState, form: FormData): Promise<EventState> {
  const user = await requireRole('manager')
  const title = formText(form, 'title').slice(0, 200)
  const start = formId(form, 'start')
  const duration = Number(formText(form, 'duration'))
  if (!user.companyId || !title || !start || !Number.isSafeInteger(duration) || duration < 0 || duration > 31 * 86400) {
    return { status: 'error', error: 'invalid' }
  }
  try {
    await addSchoolEvent(user.userId, user.companyId, { title, description: formText(form, 'details').slice(0, 1000), start, duration })
    const [school, people] = await Promise.all([getTenantName(user.companyId), schoolPeople(user.userId, user.companyId)])
    await notify(
      people.filter((p) => !p.pending && p.id !== user.userId),
      'schoolEvent',
      { school: school ?? '', event: title },
      '/timetable',
    )
  } catch (e) {
    reportError('add school event failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath('/', 'layout')
  return { status: 'saved', at: Date.now() }
}

export async function deleteSchoolEventAction(form: FormData) {
  const user = await requireRole('manager')
  const eventId = formId(form, 'eventId')
  if (!user.companyId || !eventId) return
  await deleteSchoolEvent(user.userId, user.companyId, eventId)
  revalidatePath('/', 'layout')
}
