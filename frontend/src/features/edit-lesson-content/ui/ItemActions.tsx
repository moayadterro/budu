'use client'

import { ReactNode, useCallback, useState } from 'react'
import type { LessonItem } from '@/entities/course'
import { Button } from '@/shared/ui/button'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions as ItemActionsSlot } from '@/shared/ui/item'
import { t } from '@/shared/i18n'
import { deleteItemAction } from '../server/actions'
import { TaskForm } from './TaskForm'

/**
 * Wraps one lesson item (`children`: its media + content) in an <Item> with its edit (tasks) and delete controls.
 * Editing a task swaps the row for the task form.
 */
export function ItemActions({
  courseId,
  lessonId,
  item,
  children,
}: {
  courseId: number
  lessonId: number
  item: LessonItem
  children: ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const close = useCallback(() => setEditing(false), [])
  const s = t.courses
  if (editing) return <TaskForm courseId={courseId} lessonId={lessonId} task={item} onDone={close} />
  return (
    <Item variant="outline" size="sm" className="flex-nowrap items-start">
      {children}
      <ItemActionsSlot>
        {item.kind === 'task' && (
          <Button size="icon-sm" variant="ghost" type="button" onClick={() => setEditing(true)} aria-label={s.editTask} title={s.editTask}>
            <Icon name="pencil" />
          </Button>
        )}
        <form action={deleteItemAction}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="itemId" value={item.id} />
          <ConfirmButton label={s.delete} confirmLabel={s.confirmDelete} />
        </form>
      </ItemActionsSlot>
    </Item>
  )
}
