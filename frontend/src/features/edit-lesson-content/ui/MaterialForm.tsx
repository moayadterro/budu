'use client'

import { FormEvent, useActionState, useEffect, useState } from 'react'
import { COURSE_LIMITS } from '@/entities/course'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '@/shared/config/upload'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { t } from '@/shared/i18n'
import { addMaterialAction } from '../server/actions'
import type { ContentFormState } from '../model/types'
import { FilePicker } from './FilePicker'

const idle: ContentFormState = { status: 'idle' }
const ACCEPT = 'video/*,application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.txt'

/** Upload a video / PDF / document into a lesson. */
export function MaterialForm({ courseId, lessonId, onDone }: { courseId: number; lessonId: number; onDone: () => void }) {
  const [state, action] = useActionState(addMaterialAction, idle)
  const [tooBig, setTooBig] = useState(false)
  const s = t.courses
  useEffect(() => {
    if (state.status === 'saved') onDone()
  }, [state, onDone])

  // Check the size before sending hundreds of MB the server would refuse anyway.
  const check = (e: FormEvent<HTMLFormElement>) => {
    const file = new FormData(e.currentTarget).get('file')
    const big = file instanceof File && file.size > MAX_UPLOAD_BYTES
    setTooBig(big)
    if (big) e.preventDefault()
  }

  const error = tooBig ? 'tooBig' : state.status === 'error' ? state.error : null
  return (
    <form action={action} onSubmit={check} className="rounded-lg border bg-muted/40 p-4">
      {error && <Alert variant="destructive" className="mb-4">{s.errors[error]}</Alert>}
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <div className="mb-4">
        <FilePicker name="file" label={s.addMaterial} hint={s.materialHint(MAX_UPLOAD_MB)} accept={ACCEPT} required />
      </div>
      <Field label={s.materialName}>
        <Input name="name" maxLength={COURSE_LIMITS.title} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <SubmitButton label={s.upload} pendingLabel={s.uploading} />
        <Button type="button" variant="outline" onClick={onDone}>
          {s.cancel}
        </Button>
      </div>
    </form>
  )
}
