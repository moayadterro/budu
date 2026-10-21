import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QuizKindBadge, QuizStateBadge } from '@/entities/quiz'
import { quizForStudent } from '@/entities/quiz/server'
import { requireRole } from '@/entities/session/server'
import { getGradeScale } from '@/entities/tenant/server'
import { StartQuiz } from '@/features/take-quiz'
import { formatGrade, scaleMax } from '@/shared/lib/grade-scale'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { getT } from '@/shared/i18n/server'

/** Student: a quiz / exam before taking it — what to expect, then Start / Continue / See result. */
export async function StudentQuizPage({ params }: { params: Promise<{ courseId: string; quizId: string }> }) {
  const user = await requireRole('student')
  const p = await params
  const quiz = await quizForStudent(user.userId, Number(p.quizId))
  if (!quiz || quiz.courseId !== Number(p.courseId)) notFound()
  const t = await getT()
  const s = t.quiz.intro
  const scale = await getGradeScale(user.companyId)
  const rows: Array<[string, React.ReactNode]> = [
    [s.questions, quiz.questionCount],
    [s.timeLimit, quiz.timeLimit ? t.quiz.list.minutes(Math.round(quiz.timeLimit / 60)) : s.noLimit],
    [s.attempts, quiz.attempts ? `${quiz.attemptsUsed} / ${quiz.attempts}` : s.unlimited],
  ]
  if (quiz.opensAt) rows.push([s.opens, <LocalTime key="o" seconds={quiz.opensAt} />])
  if (quiz.closesAt) rows.push([s.closes, <LocalTime key="c" seconds={quiz.closesAt} />])
  if (quiz.passMark) rows.push([s.passMark, formatGrade(quiz.passMark, scale)])

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ms-2 self-start" asChild>
        <Link href={`/classes/${quiz.courseId}`}>
          <Icon name="back" className="rtl:-scale-x-100" />
          {quiz.courseTitle}
        </Link>
      </Button>
      <Card>
        <CardContent className="flex flex-col gap-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <QuizKindBadge kind={quiz.kind} />
              <QuizStateBadge quiz={quiz} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{quiz.name}</h1>
            {quiz.intro && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{quiz.intro}</p>}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">{quiz.kind === 'exam' ? s.examRules : s.quizRules}</p>
          {quiz.grade !== null && (
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <div className="text-sm">{s.yourGrade}</div>
                {scale !== 'percent' && <div className="text-xs text-muted-foreground">{t.scales[scale]}</div>}
              </div>
              <div className="text-end">
                <div className="text-2xl font-semibold tabular-nums">
                  {formatGrade(quiz.grade, scale)}
                  {scaleMax(scale) && <span className="ms-1 text-sm font-normal text-muted-foreground">{scaleMax(scale)}</span>}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">{Math.round(quiz.grade)}%</div>
              </div>
            </div>
          )}
          {quiz.needsGrading && <p className="text-sm text-muted-foreground">{t.quiz.review.waiting}</p>}
          {(quiz.canStart || quiz.state === 'inprogress') && <StartQuiz quizId={quiz.id} inProgress={quiz.state === 'inprogress'} />}
          {quiz.state === 'finished' && quiz.attemptId > 0 && (
            <Button variant="outline" asChild>
              <Link href={`/quiz/${quiz.attemptId}/review`}>{s.seeResult}</Link>
            </Button>
          )}
          {!quiz.canStart && quiz.state === 'new' && <p className="text-sm text-muted-foreground">{s.notOpen}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
