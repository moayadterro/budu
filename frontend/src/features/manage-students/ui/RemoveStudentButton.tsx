'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useT } from '@/shared/i18n'
import { removeStudentAction } from '../server/actions'

export function RemoveStudentButton({ courseId, studentId, name }: { courseId: number; studentId: number; name: string }) {
  const t = useT()
  return (
    <form action={removeStudentAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="studentId" value={studentId} />
      <ConfirmButton icon="userRemove" label={t.teach.remove} confirmLabel={t.confirm.removeStudentTitle(name)} description={t.confirm.removeStudentDesc} />
    </form>
  )
}
