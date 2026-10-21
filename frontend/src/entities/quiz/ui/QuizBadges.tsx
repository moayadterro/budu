'use client'

import { Badge } from '@/shared/ui/badge'
import { useT } from '@/shared/i18n'
import type { QuizKind, StudentQuiz } from '../model/types'

/** "Quiz" (practice) or "Exam". */
export function QuizKindBadge({ kind }: { kind: QuizKind }) {
  const t = useT()
  return <Badge variant={kind === 'exam' ? 'warning' : 'info'}>{t.quiz.kind[kind]}</Badge>
}

/** A student's state on a quiz: to do / in progress / waiting for grading / graded / closed. */
export function QuizStateBadge({ quiz }: { quiz: Pick<StudentQuiz, 'state' | 'canStart' | 'grade' | 'needsGrading'> }) {
  const t = useT()
  const s = t.quiz.state
  if (quiz.state === 'inprogress') return <Badge variant="warning">{s.inprogress}</Badge>
  if (quiz.state === 'finished') {
    if (quiz.needsGrading) return <Badge variant="secondary">{s.waiting}</Badge>
    if (quiz.grade !== null) return <Badge variant="success">{s.done}</Badge>
    return <Badge variant="secondary">{s.submitted}</Badge>
  }
  if (quiz.state === 'closed') return <Badge variant="secondary">{s.closed}</Badge>
  return <Badge variant={quiz.canStart ? 'info' : 'secondary'}>{quiz.canStart ? s.todo : s.notOpen}</Badge>
}
