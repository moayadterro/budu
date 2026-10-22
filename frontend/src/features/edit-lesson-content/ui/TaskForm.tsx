'use client'

import { FormEvent, useActionState, useEffect, useState } from 'react'
import { COURSE_LIMITS, type LessonItem } from '@/entities/course'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '@/shared/config/upload'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { DateTimeInput } from '@/shared/ui/date-input'
import { Textarea } from '@/shared/ui/textarea'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { saveTaskAction } from '../server/actions'
import type { ContentFormState } from '../model/types'
import { FilePicker } from '@/shared/ui/file-picker'

const idle: ContentFormState = { status: 'idle' }

/** unix seconds → value for <input type="datetime-local"> in the browser's time zone */
function toLocalInput(seconds: number | null) {
  if (!seconds) return ''
  const d = new Date(seconds * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Add a task to a lesson, or edit `task`. Only rendered after a click, so local time is safe to use. */
export function TaskForm({
  courseId,
  lessonId,
  task,
  onDone,
}: {
  courseId: number
  lessonId: number
  task?: LessonItem
  onDone: () => void
}) {
  const t = useT()
  const [state, action] = useActionState(saveTaskAction, idle)
  const [due, setDue] = useState(() => toLocalInput(task?.dueAt ?? null))
  const [tooBig, setTooBig] = useState(false)
  const s = t.courses
  useEffect(() => {
    if (state.status === 'saved') onDone()
  }, [state, onDone])

  const check = (e: FormEvent<HTMLFormElement>) => {
    const file = new FormData(e.currentTarget).get('file')
    const big = file instanceof File && file.size > MAX_UPLOAD_BYTES
    setTooBig(big)
    if (big) e.preventDefault()
  }

  const error = tooBig ? 'tooBig' : state.status === 'error' ? state.error : null
  const dueAt = due ? Math.floor(new Date(due).getTime() / 1000) : 0
  return (
    <form action={action} onSubmit={check} className="rounded-lg border bg-muted/40 p-4">
      {error && <Alert variant="destructive" className="mb-4">{s.errors[error]}</Alert>}
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      {task && <input type="hidden" name="taskId" value={task.id} />}
      <input type="hidden" name="dueAt" value={dueAt || ''} />
      <Field label={s.taskName}>
        <Input name="name" required maxLength={COURSE_LIMITS.title} defaultValue={task?.name} placeholder={s.taskNamePh} autoFocus />
      </Field>
      <Field label={s.instructions} hint={s.taskHint}>
        <Textarea name="instructions" maxLength={COURSE_LIMITS.text} defaultValue={task?.instructions} placeholder={s.instructionsPh} />
      </Field>
      <Field label={s.due}>
        <DateTimeInput value={due} onChange={setDue} clearable defaultTime="23:59" className="max-w-[360px]" />
      </Field>
      <div className="mb-4">
        <span className="mb-2 block text-sm font-medium">{task?.files.length ? s.replaceAttachment : s.attachment}</span>
        <FilePicker name="file" label={s.upload} hint={s.materialHint(MAX_UPLOAD_MB)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitButton label={s.taskSave} pendingLabel={s.saving} />
        <Button type="button" variant="outline" onClick={onDone}>
          {s.cancel}
        </Button>
      </div>
    </form>
  )
}
