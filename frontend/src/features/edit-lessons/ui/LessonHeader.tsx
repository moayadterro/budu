'use client'

import { useCallback, useRef, useState } from 'react'
import type { CourseLesson } from '@/entities/course'
import { MoreMenu } from '@/shared/ui/more-menu'
import { useT } from '@/shared/i18n'
import { deleteLessonAction, moveLessonAction } from '../server/actions'
import { LessonForm } from './LessonForm'

/** Lesson number + title + description, with its actions in a "⋯" menu: rename (inline), move up / down, delete. */
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
  const up = useRef<HTMLFormElement>(null)
  const down = useRef<HTMLFormElement>(null)
  const del = useRef<HTMLFormElement>(null)
  const s = t.courses
  if (editing) return <LessonForm courseId={courseId} lesson={lesson} onDone={close} />

  const ids = (
    <>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lesson.id} />
    </>
  )
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-7 flex-none place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-7">{lesson.title}</h3>
        {lesson.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{lesson.description}</p>}
      </div>
      {/* the menu's actions submit these (server actions stay plain forms) */}
      <form ref={up} action={moveLessonAction} hidden>
        {ids}
        <input type="hidden" name="direction" value="up" />
      </form>
      <form ref={down} action={moveLessonAction} hidden>
        {ids}
        <input type="hidden" name="direction" value="down" />
      </form>
      <form ref={del} action={deleteLessonAction} hidden>
        {ids}
      </form>
      <MoreMenu
        label={t.actionsFor(lesson.title)}
        actions={[
          { label: s.rename, icon: 'pencil', onSelect: () => setEditing(true) },
          { label: s.moveUp, icon: 'up', disabled: isFirst, onSelect: () => up.current?.requestSubmit() },
          { label: s.moveDown, icon: 'down', disabled: isLast, onSelect: () => down.current?.requestSubmit() },
        ]}
        danger={{
          label: s.delete,
          confirmLabel: t.confirm.lessonTitle(lesson.title),
          description: t.confirm.lessonDesc,
          onConfirm: () => del.current?.requestSubmit(),
        }}
      />
    </div>
  )
}
