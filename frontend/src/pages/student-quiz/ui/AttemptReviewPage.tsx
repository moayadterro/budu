import Link from 'next/link'
import { notFound } from 'next/navigation'
import { quizForStudent, reviewAttempt } from '@/entities/quiz/server'
import { requireRole } from '@/entities/session/server'
import { getGradeScale } from '@/entities/tenant/server'
import { outcomeOf } from '@/entities/quiz'
import { StartQuiz } from '@/features/take-quiz'
import { QuizReview } from '@/widgets/quiz-review'
import { formatGrade, scaleMax } from '@/shared/lib/grade-scale'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/** Student: the result of a finished attempt — as much as the quiz shows at this time. */
export async function AttemptReviewPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireRole('student')
  const id = Number((await params).attemptId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const t = await getT()
  const [review, scale] = await Promise.all([reviewAttempt(user.userId, id), getGradeScale(user.companyId)])
  if (!review) {
    // the quiz doesn't show the review yet (e.g. an exam before it closes)
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="text-sm text-muted-foreground">{t.quiz.review.notYet}</CardContent>
      </Card>
    )
  }
  const quiz = await quizForStudent(user.userId, review.quizId)
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {quiz && (
        <Button variant="ghost" size="sm" className="-ms-2 self-start" asChild>
          <Link href={`/classes/${quiz.courseId}/quizzes/${quiz.id}`}>
            <Icon name="back" className="rtl:-scale-x-100" />
            {quiz.name}
          </Link>
        </Button>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{review.name}</h1>
      <QuizReview
        review={review}
        passMark={quiz?.passMark ?? 0}
        action={
          // practice again — only after a result below the line (no "try again" on a pass)
          quiz?.canStart && review.grade !== null && outcomeOf(review.grade, quiz.passMark) === 'failed' ? (
            <div className="w-40">
              <StartQuiz quizId={quiz.id} inProgress={false} label={t.quiz.outcome.tryAgain} />
            </div>
          ) : undefined
        }
        grade={
          review.grade === null
            ? undefined
            : { label: formatGrade(review.grade, scale), outOf: scaleMax(scale) }
        }
      />
    </div>
  )
}
