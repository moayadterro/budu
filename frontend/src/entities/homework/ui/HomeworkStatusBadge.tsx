'use client'

import { Badge } from '@/shared/ui/badge'
import { DEFAULT_SCALE, formatGrade, scaleMax, type GradeScale } from '@/shared/lib/grade-scale'
import { useT } from '@/shared/i18n'
import { isLate, type HomeworkStatus } from '../model/types'

/** To do / Handed in / Graded 88 — with "Late" when past the due date. */
export function HomeworkStatusBadge({
  status,
  grade,
  dueAt,
  submittedAt,
  scale = DEFAULT_SCALE,
}: {
  status: HomeworkStatus
  grade: number | null
  dueAt: number | null
  submittedAt: number | null
  /** the school's grade display scale (grades are stored 0–100) */
  scale?: GradeScale
}) {
  const t = useT()
  if (status === 'graded') {
    return (
      <Badge variant="success" className="tabular-nums">
        {grade === null ? '—' : formatGrade(grade, scale)} {scaleMax(scale)}
      </Badge>
    )
  }
  const late = isLate({ dueAt, submittedAt })
  if (status === 'submitted') return <Badge variant={late ? 'warning' : 'info'}>{late ? `${t.hw.status.submitted} · ${t.hw.late}` : t.hw.status.submitted}</Badge>
  return <Badge variant={late ? 'live' : 'secondary'}>{late ? t.hw.late : t.hw.status.new}</Badge>
}
