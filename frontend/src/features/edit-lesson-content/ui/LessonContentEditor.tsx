'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { t } from '@/shared/i18n'
import { MaterialForm } from './MaterialForm'
import { TaskForm } from './TaskForm'

/** "Add video or PDF" / "Add task" buttons under a lesson; each opens its form inline. */
export function AddLessonContent({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const [open, setOpen] = useState<'none' | 'material' | 'task'>('none')
  const close = useCallback(() => setOpen('none'), [])
  const s = t.courses
  if (open === 'material') return <MaterialForm courseId={courseId} lessonId={lessonId} onDone={close} />
  if (open === 'task') return <TaskForm courseId={courseId} lessonId={lessonId} onDone={close} />
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen('material')}>
        <Icon name="upload" />
        {s.addMaterial}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen('task')}>
        <Icon name="task" />
        {s.addTask}
      </Button>
    </div>
  )
}
