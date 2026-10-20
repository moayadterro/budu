'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useT } from '@/shared/i18n'
import { removeStudentAction } from '../server/actions'

export function RemoveStudentButton({ courseId, studentId }: { courseId: number; studentId: number }) {
  const t = useT()
  return (
    <form action={removeStudentAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="studentId" value={studentId} />
      <ConfirmButton label={t.teach.remove} confirmLabel={t.teach.confirmRemove} />
    </form>
  )
}
