'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import { MaterialForm } from './MaterialForm'
import { TaskForm } from './TaskForm'
import { TextForm } from './TextForm'

/** "Add video or PDF" / "Add text" / "Add task" buttons under a lesson; each opens its form inline. */
export function AddLessonContent({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const t = useT()
  const [open, setOpen] = useState<'none' | 'material' | 'text' | 'task'>('none')
  const close = useCallback(() => setOpen('none'), [])
  const s = t.courses
  if (open === 'material') return <MaterialForm courseId={courseId} lessonId={lessonId} onDone={close} />
  if (open === 'text') return <TextForm courseId={courseId} lessonId={lessonId} onDone={close} />
  if (open === 'task') return <TaskForm courseId={courseId} lessonId={lessonId} onDone={close} />
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen('material')}>
        <Icon name="upload" />
        {s.addMaterial}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen('text')}>
        <Icon name="text" />
        {s.addText}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen('task')}>
        <Icon name="task" />
        {s.addTask}
      </Button>
    </div>
  )
}
