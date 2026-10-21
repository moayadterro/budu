'use client'

import { useActionState, useEffect } from 'react'
import { COURSE_LIMITS, type LessonItem } from '@/entities/course'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { RichTextEditor } from '@/shared/ui/rich-text-editor'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { saveTextAction } from '../server/actions'
import type { ContentFormState } from '../model/types'

const idle: ContentFormState = { status: 'idle' }

/** Add a text page to a lesson, or edit `page`: title + rich text. */
export function TextForm({ courseId, lessonId, page, onDone }: { courseId: number; lessonId: number; page?: LessonItem; onDone: () => void }) {
  const t = useT()
  const s = t.courses
  const [state, action] = useActionState(saveTextAction, idle)
  useEffect(() => {
    if (state.status === 'saved') onDone()
  }, [state, onDone])
  return (
    <form action={action} className="rounded-lg border bg-muted/40 p-4">
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>}
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      {page && <input type="hidden" name="pageId" value={page.id} />}
      <Field label={s.textName}>
        <Input name="name" required maxLength={COURSE_LIMITS.title} defaultValue={page?.name} placeholder={s.textNamePh} autoFocus />
      </Field>
      <div className="mb-4">
        <span className="mb-2 block text-sm font-medium">{s.textBody}</span>
        <RichTextEditor name="html" defaultValue={page?.content} label={s.textBody} />
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitButton label={s.textSave} pendingLabel={s.saving} />
        <Button type="button" variant="outline" onClick={onDone}>
          {s.cancel}
        </Button>
      </div>
    </form>
  )
}
