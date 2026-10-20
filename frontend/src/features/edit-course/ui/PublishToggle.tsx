'use client'

import type { CourseSummary } from '@/entities/course'
import { Badge } from '@/shared/ui/badge'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { setCoursePublished } from '../server/actions'

/** Draft ↔ published, with a one-line explanation. */
export function PublishToggle({ course }: { course: CourseSummary }) {
  const t = useT()
  const s = t.courses
  return (
    <form action={setCoursePublished} className="flex flex-col items-start gap-3">
      <input type="hidden" name="courseId" value={course.id} />
      <input type="hidden" name="title" value={course.title} />
      <input type="hidden" name="description" value={course.description} />
      <input type="hidden" name="published" value={course.published ? '0' : '1'} />
      <Badge variant={course.published ? 'success' : 'secondary'}>{course.published ? s.published : s.draft}</Badge>
      <p className="text-sm text-muted-foreground">{course.published ? s.publishedHint : s.draftHint}</p>
      <SubmitButton
        label={course.published ? s.unpublish : s.publish}
        pendingLabel={s.saving}
        variant={course.published ? 'outline' : 'default'}
        className="w-full"
      />
    </form>
  )
}
