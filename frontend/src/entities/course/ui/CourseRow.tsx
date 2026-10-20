import { ReactNode } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { t } from '@/shared/i18n'
import type { CourseSummary } from '../model/types'

/** One course in a teacher's list: thumb, title, lessons · updated, status; `action` slot (e.g. Edit). */
export function CourseRow({ course, action }: { course: CourseSummary; action?: ReactNode }) {
  const s = t.courses
  return (
    <Item variant="outline" className="bg-card">
      <ItemMedia className="size-11 rounded-lg bg-brand text-primary-foreground">
        <Icon name="book" className="size-5" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{course.title}</ItemTitle>
        <ItemDescription>
          {s.lessonCount(course.lessonCount)} · {s.updated} <LocalTime seconds={course.updatedAt} />
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant={course.published ? 'success' : 'secondary'}>{course.published ? s.published : s.draft}</Badge>
        {action}
      </ItemActions>
    </Item>
  )
}
