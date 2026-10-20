'use client'

import { useActionState } from 'react'
import { COURSE_LIMITS } from '@/entities/course'
import { Alert } from '@/shared/ui/alert'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { t } from '@/shared/i18n'
import { createCourseAction } from '../server/actions'
import type { CourseFormState } from '../model/types'

const idle: CourseFormState = { status: 'idle' }

export function CreateCourseForm() {
  const [state, action] = useActionState(createCourseAction, idle)
  const s = t.courses
  return (
    <form action={action}>
      {state.status === 'error' && (
        <Appear>
          <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>
        </Appear>
      )}
      <Field label={s.name}>
        <Input name="title" required maxLength={COURSE_LIMITS.title} placeholder={s.namePh} autoFocus />
      </Field>
      <Field label={s.desc}>
        <Textarea name="description" maxLength={COURSE_LIMITS.text} placeholder={s.descPh} />
      </Field>
      <SubmitButton label={s.create} pendingLabel={s.creating} />
    </form>
  )
}
