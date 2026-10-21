'use client'

import { useCallback, useRef, useState } from 'react'
import type { CourseLesson } from '@/entities/course'
import { cn } from '@/shared/lib/cn'
import { DraftBadge } from '@/shared/ui/draft-badge'
import { MoreMenu } from '@/shared/ui/more-menu'
import { useT } from '@/shared/i18n'
import { deleteLessonAction, moveLessonAction, undoLessonChangeAction } from '../server/actions'
import { LessonForm } from './LessonForm'

/**
 * Lesson number + title + description, with its actions in a "⋯" menu: rename (inline), move up /
 * down, delete — and, for an unpublished change of a published course, its badge and "Undo".
 */
export function LessonHeader({
  courseId,
  lesson,
  number,
  isFirst,
  isLast,
  published,
}: {
  courseId: number
  lesson: CourseLesson
  number: number
  isFirst: boolean
  isLast: boolean
  /** the course is published: deleting a live lesson waits for "Publish changes" */
  published: boolean
}) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const close = useCallback(() => setEditing(false), [])
  const up = useRef<HTMLFormElement>(null)
  const down = useRef<HTMLFormElement>(null)
  const del = useRef<HTMLFormElement>(null)
  const undo = useRef<HTMLFormElement>(null)
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
      <div className={cn('min-w-0 flex-1', lesson.draft === 'removed' && 'opacity-60')}>
        <h3 className={cn('flex flex-wrap items-center gap-x-2 font-medium leading-7', lesson.draft === 'removed' && 'line-through')}>
          {lesson.title}
          <DraftBadge state={lesson.draft} />
        </h3>
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
      <form ref={undo} action={undoLessonChangeAction} hidden>
        {ids}
      </form>
      <MoreMenu
        label={t.actionsFor(lesson.title)}
        actions={[
          ...(lesson.draft === 'changed' || lesson.draft === 'removed'
            ? [{ label: lesson.draft === 'removed' ? s.keepIt : s.undoChanges, icon: 'undo' as const, onSelect: () => undo.current?.requestSubmit() }]
            : []),
          { label: s.rename, icon: 'pencil', onSelect: () => setEditing(true) },
          { label: s.moveUp, icon: 'up', disabled: isFirst, onSelect: () => up.current?.requestSubmit() },
          { label: s.moveDown, icon: 'down', disabled: isLast, onSelect: () => down.current?.requestSubmit() },
        ]}
        danger={
          lesson.draft === 'removed'
            ? undefined
            : {
                label: s.delete,
                confirmLabel: t.confirm.lessonTitle(lesson.title),
                // a live lesson of a published course: students keep it until "Publish changes"
                description: published && lesson.draft !== 'new' ? `${t.confirm.lessonDesc} ${t.confirm.untilPublish}` : t.confirm.lessonDesc,
                onConfirm: () => del.current?.requestSubmit(),
              }
        }
      />
    </div>
  )
}
