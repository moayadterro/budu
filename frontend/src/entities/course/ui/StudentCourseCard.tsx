'use client'

import Link from 'next/link'
import { Badge } from '@/shared/ui/badge'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import type { StudentCourse } from '../model/types'

/** An enrolled course: title, teachers, lessons, homework still to do. Links to the course. */
export function StudentCourseCard({ course }: { course: StudentCourse }) {
  const t = useT()
  return (
    <Link
      href={`/classes/${course.id}`}
      className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors hover:bg-muted/50"
    >
      <span className="grid size-12 flex-none place-items-center rounded-lg bg-brand text-primary-foreground">
        <Icon name="book" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{course.title}</div>
        <div className="truncate text-sm text-muted-foreground">{course.teachers}</div>
        <div className="mt-1 text-xs text-muted-foreground">{t.courses.lessonCount(course.lessonCount)}</div>
      </div>
      {course.todo > 0 && <Badge variant="warning">{t.learn.todo(course.todo)}</Badge>}
      <Icon name="chevRight" className="size-4 text-muted-foreground rtl:-scale-x-100" />
    </Link>
  )
}
