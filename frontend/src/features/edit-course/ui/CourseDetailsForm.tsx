'use client'

import { useActionState } from 'react'
import { COURSE_LIMITS, type CourseSummary } from '@/entities/course'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { saveCourseDetails } from '../server/actions'
import type { CourseFormState } from '../model/types'

const idle: CourseFormState = { status: 'idle' }

/** Title + description of an existing course. */
export function CourseDetailsForm({ course }: { course: CourseSummary }) {
  const t = useT()
  const [state, action] = useActionState(saveCourseDetails, idle)
  const s = t.courses
  return (
    <form action={action}>
      {state.status === 'error' && (
        <Appear>
          <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>
        </Appear>
      )}
      <input type="hidden" name="courseId" value={course.id} />
      <input type="hidden" name="published" value={course.published ? '1' : '0'} />
      <Field label={s.name}>
        <Input name="title" required maxLength={COURSE_LIMITS.title} defaultValue={course.title} />
      </Field>
      <Field label={s.desc}>
        <Textarea name="description" maxLength={COURSE_LIMITS.text} defaultValue={course.description} placeholder={s.descPh} />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton label={s.save} pendingLabel={s.saving} variant="outline" />
        {state.status === 'saved' && (
          <Appear>
            <span className="text-sm font-medium text-success">{s.saved}</span>
          </Appear>
        )}
      </div>
    </form>
  )
}
