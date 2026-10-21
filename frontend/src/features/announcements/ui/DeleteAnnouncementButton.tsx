'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useT } from '@/shared/i18n'
import { deleteAnnouncementAction } from '../server/actions'

export function DeleteAnnouncementButton({ announcementId, title }: { announcementId: number; title: string }) {
  const t = useT()
  return (
    <form action={deleteAnnouncementAction}>
      <input type="hidden" name="announcementId" value={announcementId} />
      <ConfirmButton label={t.announcements.delete} confirmLabel={t.confirm.announcementTitle(title)} description={t.confirm.announcementDesc} />
    </form>
  )
}
