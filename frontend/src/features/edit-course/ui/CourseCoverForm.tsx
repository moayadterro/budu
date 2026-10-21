'use client'

import { useActionState, useRef } from 'react'
import { CourseCover } from '@/entities/course'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import { setCourseCoverAction, type CoverState } from '../server/actions'

const idle: CoverState = { status: 'idle' }

/** The course's cover image: preview, pick an image (uploads at once), remove. */
export function CourseCoverForm({ courseId, title, imageId }: { courseId: number; title: string; imageId: number | null }) {
  const t = useT()
  const s = t.courses.cover
  const [state, action, pending] = useActionState(setCourseCoverAction, idle)
  const form = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col gap-3">
      <CourseCover courseId={courseId} title={title} imageId={imageId} className="rounded-lg" />
      {state.status === 'error' && <Alert variant="destructive">{s.errors[state.error]}</Alert>}
      <div className="flex flex-wrap gap-2">
        <form ref={form} action={action}>
          <input type="hidden" name="courseId" value={courseId} />
          <input
            ref={input}
            type="file"
            name="cover"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="sr-only"
            onChange={() => form.current?.requestSubmit()}
          />
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => input.current?.click()}>
            <Icon name="camera" />
            {pending ? s.uploading : imageId ? s.change : s.upload}
          </Button>
        </form>
        {imageId && (
          <form action={action}>
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="remove" value="1" />
            <Button type="submit" variant="ghost" size="sm" className="text-destructive" disabled={pending}>
              {s.remove}
            </Button>
          </form>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{s.hint}</p>
    </div>
  )
}
