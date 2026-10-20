'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Appear } from '@/shared/ui/motion'
import { useT } from '@/shared/i18n'

/** Marks the lesson complete. Local for now; later writes completion to IOMAD. */
export function MarkComplete() {
  const t = useT()
  const [done, setDone] = useState(false)
  if (done) {
    return (
      <Appear>
        <span className="text-[13px] font-semibold text-success">{t.lesson.completed}</span>
      </Appear>
    )
  }
  return (
    <Button onClick={() => setDone(true)}>
      <Icon name="tick" strokeWidth={2} />
      {t.lesson.complete}
    </Button>
  )
}
