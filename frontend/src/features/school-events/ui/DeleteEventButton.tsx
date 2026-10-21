'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useT } from '@/shared/i18n'
import { deleteSchoolEventAction } from '../server/actions'

export function DeleteEventButton({ eventId }: { eventId: number }) {
  const t = useT()
  return (
    <form action={deleteSchoolEventAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <ConfirmButton label={t.timetable.deleteEvent} confirmLabel={t.timetable.confirmDelete} />
    </form>
  )
}
