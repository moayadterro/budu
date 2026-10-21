'use client'

import { useCallback, useState, useTransition } from 'react'
import type { Question } from '@/entities/quiz'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import { moveQuestionAction } from '../server/actions'
import { QuestionEditor } from './QuestionEditor'

/** The quiz's questions in order: edit, move up / down, remove, and add new ones. */
export function QuizQuestions({ quizId, questions, editable }: { quizId: number; questions: Question[]; editable: boolean }) {
  const t = useT()
  const s = t.quiz.q
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [pending, start] = useTransition()
  const close = useCallback(() => setEditing(null), [])
  const move = (slot: number, d: -1 | 0 | 1) => start(() => moveQuestionAction(quizId, slot, d))
  const total = questions.reduce((n, q) => n + q.mark, 0)

  return (
    <div className="flex flex-col gap-3">
      {!editable && <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">{s.locked}</p>}
      {questions.length === 0 && editing !== 'new' && <p className="text-sm text-muted-foreground">{s.none}</p>}
      {questions.map((q, i) =>
        editing === q.slot ? (
          <QuestionEditor key={q.slot} quizId={quizId} question={q} onDone={close} />
        ) : (
          <div key={q.slot} className="flex items-start gap-3 rounded-lg border p-3">
            <span className="grid size-7 flex-none place-items-center rounded-md bg-muted text-xs font-semibold tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-line text-sm">{q.type === 'gapselect' ? q.text.replace(/\[\[\d+\]\]/g, '____') : q.text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-normal">
                  {s.types[q.type]}
                </Badge>
                {s.points(q.mark)}
              </div>
            </div>
            <div className="flex flex-none items-center gap-0.5">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(q.slot)} aria-label={s.edit} title={s.edit}>
                <Icon name="pencil" />
              </Button>
              {editable && (
                <>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={pending || i === 0} onClick={() => move(q.slot, -1)} aria-label={s.up} title={s.up}>
                    <Icon name="up" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={pending || i === questions.length - 1} onClick={() => move(q.slot, 1)} aria-label={s.down} title={s.down}>
                    <Icon name="down" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={pending} onClick={() => move(q.slot, 0)} aria-label={s.remove} title={s.remove}>
                    <Icon name="trash" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ),
      )}
      {editing === 'new' ? (
        <QuestionEditor quizId={quizId} onDone={close} />
      ) : (
        editable && (
          <Button type="button" variant="outline" className="self-start" onClick={() => setEditing('new')}>
            <Icon name="plus" />
            {s.add}
          </Button>
        )
      )}
      {questions.length > 0 && <p className="text-xs text-muted-foreground">{s.total(questions.length, total)}</p>}
    </div>
  )
}
