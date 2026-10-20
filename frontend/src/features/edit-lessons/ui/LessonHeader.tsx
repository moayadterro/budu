'use client'

import { useCallback, useState } from 'react'
import type { CourseLesson } from '@/entities/course'
import { Button } from '@/shared/ui/button'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import { deleteLessonAction, moveLessonAction } from '../server/actions'
import { LessonForm } from './LessonForm'

/** Lesson number + title + description, with move / edit / delete controls (edit opens inline). */
export function LessonHeader({
  courseId,
  lesson,
  number,
  isFirst,
  isLast,
}: {
  courseId: number
  lesson: CourseLesson
  number: number
  isFirst: boolean
  isLast: boolean
}) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const close = useCallback(() => setEditing(false), [])
  const s = t.courses
  if (editing) return <LessonForm courseId={courseId} lesson={lesson} onDone={close} />

  const ids = (
    <>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lesson.id} />
    </>
  )
  return (
    <div className="flex flex-wrap items-start gap-3">
      <span className="grid size-7 flex-none place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-7">{lesson.title}</h3>
        {lesson.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{lesson.description}</p>}
      </div>
      <div className="flex items-center gap-1">
        <form action={moveLessonAction}>
          {ids}
          <input type="hidden" name="direction" value="up" />
          <Button size="icon-sm" variant="ghost" type="submit" disabled={isFirst} aria-label={s.moveUp} title={s.moveUp}>
            <Icon name="up" />
          </Button>
        </form>
        <form action={moveLessonAction}>
          {ids}
          <input type="hidden" name="direction" value="down" />
          <Button size="icon-sm" variant="ghost" type="submit" disabled={isLast} aria-label={s.moveDown} title={s.moveDown}>
            <Icon name="down" />
          </Button>
        </form>
        <Button size="icon-sm" variant="ghost" type="button" onClick={() => setEditing(true)} aria-label={s.rename} title={s.rename}>
          <Icon name="pencil" />
        </Button>
        <form action={deleteLessonAction}>
          {ids}
          <ConfirmButton label={s.delete} confirmLabel={s.confirmDelete} />
        </form>
      </div>
    </div>
  )
}
