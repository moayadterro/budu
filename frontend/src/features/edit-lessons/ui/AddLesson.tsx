'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { t } from '@/shared/i18n'
import { LessonForm } from './LessonForm'

/** Dashed "Add lesson" button that opens the lesson form. */
export function AddLesson({ courseId }: { courseId: number }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  if (open) return <LessonForm courseId={courseId} onDone={close} />
  return (
    <Button type="button" variant="outline" className="h-11 w-full border-dashed text-primary" onClick={() => setOpen(true)}>
      <Icon name="plus" />
      {t.courses.addLesson}
    </Button>
  )
}
