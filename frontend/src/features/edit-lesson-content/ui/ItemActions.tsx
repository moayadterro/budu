'use client'

import { ReactNode, useCallback, useRef, useState } from 'react'
import type { LessonItem } from '@/entities/course'
import { Item, ItemActions as ItemActionsSlot } from '@/shared/ui/item'
import { MoreMenu, type MenuAction } from '@/shared/ui/more-menu'
import { useT } from '@/shared/i18n'
import { deleteItemAction } from '../server/actions'
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
  children,
}: {
  courseId: number
  lessonId: number
  item: LessonItem
  children: ReactNode
}) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const close = useCallback(() => setEditing(false), [])
  const del = useRef<HTMLFormElement>(null)
  const s = t.courses
  if (editing && item.kind === 'text') return <TextForm courseId={courseId} lessonId={lessonId} page={item} onDone={close} />
  if (editing) return <TaskForm courseId={courseId} lessonId={lessonId} task={item} onDone={close} />
  const edit: MenuAction[] =
    item.kind === 'task' || item.kind === 'text'
      ? [{ label: item.kind === 'text' ? s.editText : s.editTask, icon: 'pencil', onSelect: () => setEditing(true) }]
      : []
  return (
    <Item variant="outline" size="sm" className="flex-nowrap items-start">
      {children}
      <ItemActionsSlot>
        <form ref={del} action={deleteItemAction} hidden>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="itemId" value={item.id} />
        </form>
        <MoreMenu
          label={t.actionsFor(item.name)}
          actions={edit}
          danger={{
            label: s.delete,
            confirmLabel: t.confirm.itemTitle(item.name),
            description: item.kind === 'task' ? t.confirm.taskDesc : t.confirm.itemDesc,
            onConfirm: () => del.current?.requestSubmit(),
          }}
        />
      </ItemActionsSlot>
    </Item>
  )
}
