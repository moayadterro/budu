'use client'

import type { ReactNode } from 'react'
import { ResultSummary, type Review } from '@/entities/quiz'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { useT } from '@/shared/i18n'

/**
 * An answer as the reader should see it: true / false come as values (shown in the UI language);
 * missing-word answers come as "{mass} {acceleration}" (shown as the words).
 */
const answerText = (type: string, text: string, tf: { true: string; false: string }) =>
  type === 'truefalse' && (text === 'true' || text === 'false') ? tf[text] : type === 'gapselect' ? text.replace(/\{([^}]*)\}/g, '$1') : text

const resultVariant = { correct: 'success', partiallycorrect: 'warning', incorrect: 'destructive', needsgrading: 'secondary', unanswered: 'secondary' } as const

/**
 * A finished attempt: the grade (or "waiting for the teacher"), then each question with the answer
 * given and — when the quiz shows them — result, points, correct answer, explanation, teacher comment.
 * The grade is shown in the school's scale as "3 / 5" (`grade`), coloured by outcome against `passMark`.
 * `gradeForms` = the teacher's grading form per slot.
 */
export function QuizReview({
  review,
  grade,
  passMark = 0,
  action,
  gradeForms,
}: {
  review: Review
  grade?: { label: string; outOf: string | null }
  /** 0–100, 0 = none */
  passMark?: number
  /** under the result, e.g. "Try again" */
  action?: ReactNode
  gradeForms?: Record<number, ReactNode>
}) {
  const t = useT()
  const s = t.quiz.review
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          {review.grade !== null ? (
            <ResultSummary
              grade={review.grade}
              label={grade?.label ?? String(review.grade)}
              outOf={grade?.outOf ?? null}
              passMark={passMark}
              caption={
                <>
                  {s.submitted} <LocalTime seconds={review.submittedAt} />
                </>
              }
              action={action}
            />
          ) : (
            <div>
              <div className="text-sm text-muted-foreground">
                {s.submitted} <LocalTime seconds={review.submittedAt} />
              </div>
              <div className="mt-1 text-sm">{review.needsGrading ? s.waiting : s.hidden}</div>
            </div>
          )}
        </CardContent>
      </Card>
      {review.questions.map((q, i) => (
        <Card key={q.slot}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-sm font-semibold">{t.quiz.take.question(i + 1)}</h2>
              <div className="flex items-center gap-2">
                {q.result && <Badge variant={resultVariant[q.result]}>{s.result[q.result]}</Badge>}
                {q.mark !== null && (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {q.mark} / {q.maxMark}
                  </span>
                )}
              </div>
            </div>
            <p className="whitespace-pre-line text-sm">{q.type === 'gapselect' ? q.text.replace(/\[\[\d+\]\]/g, '____') : q.text}</p>
            <dl className="grid gap-2 text-sm">
              {/* right = green ✓, wrong = red ✗; partly right / to be graded / hidden stay neutral */}
              <div
                className={cn(
                  'rounded-md border-s-2 px-3 py-2',
                  q.result === 'correct' ? 'border-success bg-success/10' : q.result === 'incorrect' ? 'border-destructive bg-destructive/10' : 'border-border bg-muted/40',
                )}
              >
                <dt className="text-xs text-muted-foreground">{s.yourAnswer}</dt>
                <dd className="flex items-start gap-1.5 whitespace-pre-line">
                  {q.result === 'correct' && <Icon name="tick" className="mt-0.5 size-4 flex-none text-success" aria-label={s.result.correct} />}
                  {q.result === 'incorrect' && <Icon name="close" className="mt-0.5 size-4 flex-none text-destructive" aria-label={s.result.incorrect} />}
                  <span>{q.response ? answerText(q.type, q.response, t.quiz.q) : <span className="text-muted-foreground">{s.noAnswer}</span>}</span>
                </dd>
              </div>
              {q.rightAnswer && (
                <div className="rounded-md border-s-2 border-success bg-success/5 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{s.rightAnswer}</dt>
                  <dd>{answerText(q.type, q.rightAnswer, t.quiz.q)}</dd>
                </div>
              )}
              {q.explanation && (
                <div className="px-3">
                  <dt className="text-xs text-muted-foreground">{s.explanation}</dt>
                  <dd>{q.explanation}</dd>
                </div>
              )}
              {q.comment && (
                <div className="rounded-md bg-info/5 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{s.comment}</dt>
                  <dd className="whitespace-pre-line">{q.comment}</dd>
                </div>
              )}
            </dl>
            {gradeForms?.[q.slot]}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
