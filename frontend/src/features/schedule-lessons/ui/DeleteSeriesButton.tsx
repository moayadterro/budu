'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useT } from '@/shared/i18n'
import { deleteSeriesAction } from '../server/actions'

export function DeleteSeriesButton({ courseId, seriesId }: { courseId: number; seriesId: number }) {
  const t = useT()
  return (
    <form action={deleteSeriesAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="seriesId" value={seriesId} />
      <ConfirmButton label={t.schedule.delete} confirmLabel={t.schedule.confirmDelete} />
    </form>
  )
}
