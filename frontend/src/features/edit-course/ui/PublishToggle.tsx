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
        <div className="flex w-full flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="text-sm font-medium">{s.changes(course.changes)}</p>
          <p className="text-xs text-muted-foreground">{s.changesHint}</p>
          <form action={publishChangesAction}>
            <input type="hidden" name="courseId" value={course.id} />
            <SubmitButton label={s.publishChanges} pendingLabel={s.saving} className="w-full" />
          </form>
          <form action={discardChangesAction}>
            <input type="hidden" name="courseId" value={course.id} />
            <ConfirmButton
              icon="undo"
              label={s.discardChanges}
              confirmLabel={s.discardTitle}
              description={s.discardDesc}
              keepLabel={s.keepEditing}
              className="w-full"
            />
          </form>
        </div>
      )}
      <form action={setCoursePublished} className="w-full">
        {details}
        <input type="hidden" name="published" value="0" />
        <ConfirmButton
          icon="eyeOff"
          label={s.unpublish}
          confirmLabel={s.unpublishTitle(course.title)}
          description={course.changes > 0 ? `${s.unpublishDesc} ${s.unpublishApplies}` : s.unpublishDesc}
          className="w-full"
        />
      </form>
    </div>
  )
}
