'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useT } from '@/shared/i18n'
import { deleteSeriesAction } from '../server/actions'

export function DeleteSeriesButton({ courseId, seriesId, count }: { courseId: number; seriesId: number; count: number }) {
  const t = useT()
  return (
    <form action={deleteSeriesAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="seriesId" value={seriesId} />
      <ConfirmButton icon="calRemove" label={t.schedule.delete} confirmLabel={t.confirm.seriesTitle} description={t.confirm.seriesDesc(count)} />
    </form>
  )
}
