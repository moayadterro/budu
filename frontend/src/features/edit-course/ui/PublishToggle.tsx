'use client'

import type { Course } from '@/entities/course'
import { Badge } from '@/shared/ui/badge'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { discardChangesAction, publishChangesAction, setCoursePublished } from '../server/actions'

/**
 * The course's status. Draft: only the teacher sees it → Publish. Published: students see the
 * published version while the teacher's edits wait as unpublished changes → Publish changes /
 * Discard changes; Unpublish (students lose access) is a confirmed, dangerous action.
 */
export function PublishToggle({ course }: { course: Course }) {
  const t = useT()
  const s = t.courses
  const details = (
    <>
      <input type="hidden" name="courseId" value={course.id} />
      <input type="hidden" name="title" value={course.title} />
      <input type="hidden" name="description" value={course.description} />
    </>
  )
  if (!course.published) {
    return (
      <form action={setCoursePublished} className="flex flex-col items-start gap-3">
        {details}
        <input type="hidden" name="published" value="1" />
        <Badge variant="secondary">{s.draft}</Badge>
        <p className="text-sm text-muted-foreground">{s.draftHint}</p>
        <SubmitButton label={s.publish} pendingLabel={s.saving} className="w-full" />
      </form>
    )
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <Badge variant="success">{s.published}</Badge>
      <p className="text-sm text-muted-foreground">{s.publishedHint}</p>
      {course.changes > 0 && (
        <div className="flex w-full flex-col gap-3 rounded-lg bg-muted p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="size-2 flex-none rounded-full bg-warning" aria-hidden />
            {s.changes(course.changes)}
          </p>
          <form action={publishChangesAction}>
            <input type="hidden" name="courseId" value={course.id} />
            <SubmitButton label={s.publishChanges} pendingLabel={s.saving} className="w-full" />
          </form>
          <form action={discardChangesAction} className="-mt-1 self-center">
            <input type="hidden" name="courseId" value={course.id} />
            <ConfirmButton
              variant="link"
              icon="undo"
              label={s.discardChanges}
              confirmLabel={s.discardTitle}
              description={s.discardDesc}
              keepLabel={s.keepEditing}
              className="text-muted-foreground"
            />
          </form>
        </div>
      )}
      <form action={setCoursePublished} className="self-center">
        {details}
        <input type="hidden" name="published" value="0" />
        <ConfirmButton
          variant="link"
          icon="eyeOff"
          label={s.unpublish}
          confirmLabel={s.unpublishTitle(course.title)}
          description={course.changes > 0 ? `${s.unpublishDesc} ${s.unpublishApplies}` : s.unpublishDesc}
          className="text-muted-foreground"
        />
      </form>
    </div>
  )
}
