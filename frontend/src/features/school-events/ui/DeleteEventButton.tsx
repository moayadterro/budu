'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useT } from '@/shared/i18n'
import { deleteSchoolEventAction } from '../server/actions'

export function DeleteEventButton({ eventId, title }: { eventId: number; title: string }) {
  const t = useT()
  return (
    <form action={deleteSchoolEventAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <ConfirmButton icon="calRemove" label={t.timetable.deleteEvent} confirmLabel={t.confirm.eventTitle(title)} description={t.confirm.eventDesc} />
    </form>
  )
}
