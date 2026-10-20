'use client'

import { useActionState, useEffect } from 'react'
import { COURSE_LIMITS } from '@/entities/course'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { SubmitButton } from '@/shared/ui/submit-button'
import { t } from '@/shared/i18n'
import { saveLessonAction } from '../server/actions'
import type { LessonFormState } from '../model/types'

const idle: LessonFormState = { status: 'idle' }

/** Add (no `lesson`) or edit a lesson's title and description. Calls `onDone` after saving or cancel. */
export function LessonForm({
  courseId,
  lesson,
  onDone,
}: {
  courseId: number
  lesson?: { id: number; title: string; description: string }
  onDone: () => void
}) {
  const [state, action] = useActionState(saveLessonAction, idle)
  const s = t.courses
  useEffect(() => {
    if (state.status === 'saved') onDone()
  }, [state, onDone])

  return (
    <form action={action} className="rounded-lg border bg-muted/40 p-4">
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>}
      <input type="hidden" name="courseId" value={courseId} />
      {lesson && <input type="hidden" name="lessonId" value={lesson.id} />}
      <Field label={s.lessonName}>
        <Input name="title" required maxLength={COURSE_LIMITS.title} defaultValue={lesson?.title} placeholder={s.lessonNamePh} autoFocus />
      </Field>
      <Field label={s.lessonDesc}>
        <Textarea
          name="description"
          maxLength={COURSE_LIMITS.text}
          defaultValue={lesson?.description}
          placeholder={s.lessonDescPh}
          className="min-h-[64px]"
        />
      </Field>
      <div className="flex gap-2">
        <SubmitButton label={lesson ? s.save : s.addLesson} pendingLabel={s.saving} />
        <Button type="button" variant="outline" onClick={onDone}>
          {s.cancel}
        </Button>
      </div>
    </form>
  )
}
