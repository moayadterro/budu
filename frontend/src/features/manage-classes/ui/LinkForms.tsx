'use client'

import { useActionState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { linkClassAction, unlinkClassAction, type ClassFormState } from '../server/actions'

const idle: ClassFormState = { status: 'idle' }

/**
 * Enrol a class into a course. Give the fixed side (`classId` from a class page, or `courseId` from a
 * course page) and the options for the other side.
 */
export function EnrolClassForm({
  classId,
  courseId,
  options,
}: {
  classId?: number
  courseId?: number
  options: Array<{ id: number; label: string }>
}) {
  const t = useT()
  const s = t.classes
  const [state, action] = useActionState(linkClassAction, idle)
  if (options.length === 0) return null
  const pick = classId ? 'courseId' : 'classId'
  return (
    <form action={action} className="flex flex-col gap-2" key={options.map((o) => o.id).join(',')}>
      {state.status === 'error' && <Alert variant="destructive">{t.courses.errors.server}</Alert>}
      {classId && <input type="hidden" name="classId" value={classId} />}
      {courseId && <input type="hidden" name="courseId" value={courseId} />}
      <div className="flex flex-col gap-2 sm:flex-row">
        <NativeSelect name={pick} required defaultValue="" className="w-full sm:w-72" aria-label={classId ? s.pickCourse : s.pickClass}>
          <NativeSelectOption value="" disabled>
            {classId ? s.pickCourse : s.pickClass}
          </NativeSelectOption>
          {options.map((o) => (
            <NativeSelectOption key={o.id} value={o.id}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <SubmitButton label={s.enrol} pendingLabel={s.enrolling} />
      </div>
    </form>
  )
}

export function UnenrolClassButton({ classId, courseId, classTitle, courseName }: { classId: number; courseId: number; classTitle: string; courseName: string }) {
  const t = useT()
  return (
    <form action={unlinkClassAction}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="courseId" value={courseId} />
      <ConfirmButton
        icon="unlink"
        label={t.classes.remove}
        confirmLabel={t.confirm.unlinkClassTitle(classTitle, courseName)}
        description={t.confirm.unlinkClassDesc}
      />
    </form>
  )
}
