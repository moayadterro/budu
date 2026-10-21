'use client'

import type { ReactNode } from 'react'
import type { Review } from '@/entities/quiz'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
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
 * The grade is shown in the school's scale (`grade`: its label, "out of", the scale's name) with what
 * it means underneath — the percentage and the points. `gradeForms` = the teacher's grading form per slot.
 */
export function QuizReview({
  review,
  grade,
  gradeForms,
}: {
  review: Review
  grade?: { label: string; outOf: string | null; scaleName: string | null }
  gradeForms?: Record<number, ReactNode>
}) {
  const t = useT()
  const s = t.quiz.review
  const maxPoints = review.questions.reduce((n, q) => n + q.maxMark, 0)
  const points = review.grade === null ? null : Math.round((review.grade / 100) * maxPoints * 100) / 100
  return (
    <div className="flex flex-col gap-4">
      <Card>
        {/* one row: what it is on the start side, the grade on the end side */}
        <CardContent className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1 text-start">
            <div className="text-sm text-muted-foreground">
              {s.submitted} <LocalTime seconds={review.submittedAt} />
            </div>
            <div className="mt-1 text-sm">{review.needsGrading ? s.waiting : review.grade === null ? s.hidden : s.yourGrade}</div>
          </div>
          {review.grade !== null && (
            <div className="text-end">
              <div className="text-3xl font-semibold tabular-nums">
                {grade?.label ?? review.grade}
                {grade?.outOf && <span className="ms-1 text-base font-normal text-muted-foreground">{grade.outOf}</span>}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">{s.score(Math.round(review.grade), points ?? 0, maxPoints)}</div>
              {grade?.scaleName && <div className="text-xs text-muted-foreground">{grade.scaleName}</div>}
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
              <div className={cn('rounded-md border-s-2 bg-muted/40 px-3 py-2', q.result === 'correct' ? 'border-success' : q.result === 'incorrect' ? 'border-destructive' : 'border-border')}>
                <dt className="text-xs text-muted-foreground">{s.yourAnswer}</dt>
                <dd className="whitespace-pre-line">{q.response ? answerText(q.type, q.response, t.quiz.q) : <span className="text-muted-foreground">{s.noAnswer}</span>}</dd>
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
