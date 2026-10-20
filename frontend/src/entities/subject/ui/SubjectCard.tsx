'use client'

import Link from 'next/link'
import { Progress } from '@/shared/ui/progress'
import { SUBJECTS, SubjectKey } from '@/shared/mock'
import { useT } from '@/shared/i18n'
import { SubjectTile } from './SubjectTile'

export function SubjectCard({ subject }: { subject: SubjectKey }) {
  const t = useT()
  const s = SUBJECTS[subject]
  return (
    <Link
      href={`/classes/${subject}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <SubjectTile subject={subject} className="size-11" />
      <div className="min-w-0 flex-1">
        <b className="text-sm font-medium">{t.subject[subject]}</b>
        <div className="text-xs text-muted-foreground">{s.teacher}</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1"><Progress value={s.progress} /></div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{s.progress}%</span>
        </div>
      </div>
    </Link>
  )
}
