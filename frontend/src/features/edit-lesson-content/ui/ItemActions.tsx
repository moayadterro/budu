'use client'

import { ReactNode, useCallback, useRef, useState } from 'react'
import type { LessonItem } from '@/entities/course'
import { cn } from '@/shared/lib/cn'
import { DraftBadge } from '@/shared/ui/draft-badge'
import { Item, ItemActions as ItemActionsSlot } from '@/shared/ui/item'
import { MoreMenu, type MenuAction } from '@/shared/ui/more-menu'
import { useT } from '@/shared/i18n'
import { deleteItemAction, undoItemChangeAction } from '../server/actions'
import { TaskForm } from './TaskForm'
import { TextForm } from './TextForm'

/**
 * Wraps one lesson item (`children`: its media + content) in an <Item> with a "⋯" menu: edit (tasks,
 * text pages — swaps the row for the item's form) and delete (asks first).
 */
export function ItemActions({
  courseId,
  lessonId,
  item,
  published,
  children,
}: {
  courseId: number
  lessonId: number
  item: LessonItem
  /** the course is published: deleting a live item waits for "Publish changes" */
  published: boolean
  children: ReactNode
}) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const close = useCallback(() => setEditing(false), [])
  const del = useRef<HTMLFormElement>(null)
  const undo = useRef<HTMLFormElement>(null)
  const s = t.courses
  if (editing && item.kind === 'text') return <TextForm courseId={courseId} lessonId={lessonId} page={item} onDone={close} />
  if (editing) return <TaskForm courseId={courseId} lessonId={lessonId} task={item} onDone={close} />
  const edit: MenuAction[] = [
    ...(item.draft === 'changed' || item.draft === 'removed'
      ? [{ label: item.draft === 'removed' ? s.keepIt : s.undoChanges, icon: 'undo' as const, onSelect: () => undo.current?.requestSubmit() }]
      : []),
    ...((item.kind === 'task' || item.kind === 'text') && item.draft !== 'removed'
      ? [{ label: item.kind === 'text' ? s.editText : s.editTask, icon: 'pencil' as const, onSelect: () => setEditing(true) }]
      : []),
  ]
  const description = item.kind === 'task' ? t.confirm.taskDesc : t.confirm.itemDesc
  return (
    <Item variant="outline" size="sm" className={cn('flex-nowrap items-start', item.draft === 'removed' && 'opacity-60 [&_[data-slot=item-title]]:line-through')}>
      {children}
      <ItemActionsSlot>
        <DraftBadge state={item.draft} />
        <form ref={del} action={deleteItemAction} hidden>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="itemId" value={item.id} />
        </form>
        <form ref={undo} action={undoItemChangeAction} hidden>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="itemId" value={item.id} />
        </form>
        <MoreMenu
          label={t.actionsFor(item.name)}
          actions={edit}
          danger={
            item.draft === 'removed'
              ? undefined
              : {
                  label: s.delete,
                  confirmLabel: t.confirm.itemTitle(item.name),
                  // a live item of a published course: students keep it until "Publish changes"
                  description: published && item.draft !== 'new' ? `${description} ${t.confirm.untilPublish}` : description,
                  onConfirm: () => del.current?.requestSubmit(),
                }
          }
        />
      </ItemActionsSlot>
    </Item>
  )
}
