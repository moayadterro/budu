'use client'

import { Badge } from '@/shared/ui/badge'
import { useT } from '@/shared/i18n'
import { isLate, type HomeworkStatus } from '../model/types'

/** To do / Handed in / Graded 88 — with "Late" when past the due date. */
export function HomeworkStatusBadge({
  status,
  grade,
  dueAt,
  submittedAt,
}: {
  status: HomeworkStatus
  grade: number | null
  dueAt: number | null
  submittedAt: number | null
}) {
  const t = useT()
  if (status === 'graded') return <Badge variant="success" className="tabular-nums">{grade ?? '—'} {t.hw.outOf}</Badge>
  const late = isLate({ dueAt, submittedAt })
  if (status === 'submitted') return <Badge variant={late ? 'warning' : 'info'}>{late ? `${t.hw.status.submitted} · ${t.hw.late}` : t.hw.status.submitted}</Badge>
  return <Badge variant={late ? 'live' : 'secondary'}>{late ? t.hw.late : t.hw.status.new}</Badge>
}
