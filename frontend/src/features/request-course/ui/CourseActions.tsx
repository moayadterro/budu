'use client'

import { useState } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { t } from '@/shared/i18n'

/**
 * Buy/enrol for yourself, or ask your school to provide the course.
 * Local state for now; later: payment + an approval request to the school manager.
 */
export function CourseActions({ free }: { free: boolean }) {
  const [requested, setRequested] = useState(false)
  if (requested) {
    return (
      <Badge variant="warning" className="justify-center py-[9px]">
        {t.explore.requested}
      </Badge>
    )
  }
  return (
    <div className="flex gap-[7px]">
      <Button variant="highlight" className="flex-1 px-2 py-[9px] text-xs">
        {free ? t.explore.enroll : t.explore.buy}
      </Button>
      <Button variant="outline" className="flex-1 px-2 py-[9px] text-xs" onClick={() => setRequested(true)}>
        {t.explore.askSchool}
      </Button>
    </div>
  )
}
