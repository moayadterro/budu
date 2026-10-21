import { notFound } from 'next/navigation'
import { teacherReview } from '@/entities/quiz/server'
import { getGradeScale } from '@/entities/tenant/server'
import { getUserById } from '@/entities/user/server'
import { GradeAnswer } from '@/features/grade-quiz'
import { QuizReview } from '@/widgets/quiz-review'
import { formatGrade, scaleMax } from '@/shared/lib/grade-scale'
import { getT } from '@/shared/i18n/server'
import { BackLink, managerExam } from './shared'

/** Manager: one person's exam attempt — everything shown, written answers graded here. */
export async function SchoolExamAttemptPage({ params }: { params: Promise<{ quizId: string; attemptId: string }> }) {
  const p = await params
  const { user, companyId, quiz } = await managerExam(p.quizId)
  const review = await teacherReview(user.userId, Number(p.attemptId))
  if (!review || review.quizId !== quiz.id) notFound()
  const [student, scale] = await Promise.all([getUserById(review.studentId), getGradeScale(companyId)])
  const t = await getT()
  const forms = Object.fromEntries(
    review.questions
      .filter((q) => q.type === 'essay' || q.result === 'needsgrading')
      .map((q) => [q.slot, <GradeAnswer key={q.slot} attemptId={review.id} slot={q.slot} maxMark={q.maxMark} mark={q.mark} comment={q.comment} />]),
  )
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <BackLink href={`/school/exams/${quiz.id}/results`} label={t.quiz.results.title} />
      <h1 className="text-xl font-semibold tracking-tight">
        {student?.name} · {quiz.name}
      </h1>
      <QuizReview
        review={review}
        passMark={quiz.passMark}
        grade={review.grade === null ? undefined : { label: formatGrade(review.grade, scale), outOf: scaleMax(scale) }}
        gradeForms={forms}
      />
    </div>
  )
}
