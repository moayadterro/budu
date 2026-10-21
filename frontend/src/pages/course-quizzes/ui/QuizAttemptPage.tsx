import { notFound } from 'next/navigation'
import { getQuiz, teacherReview } from '@/entities/quiz/server'
import { getGradeScale } from '@/entities/tenant/server'
import { getUserById } from '@/entities/user/server'
import { GradeAnswer } from '@/features/grade-quiz'
import { QuizReview } from '@/widgets/quiz-review'
import { formatGrade, scaleMax } from '@/shared/lib/grade-scale'
import { getT } from '@/shared/i18n/server'
import { CourseQuizHeader, courseForQuizzes } from './shared'

/** Teacher: one student's attempt — everything shown, written answers graded here. */
export async function QuizAttemptPage({ params }: { params: Promise<{ courseId: string; quizId: string; attemptId: string }> }) {
  const p = await params
  const { user, course } = await courseForQuizzes(p.courseId)
  const review = await teacherReview(user.userId, Number(p.attemptId))
  if (!review || review.quizId !== Number(p.quizId)) notFound()
  const [quiz, student, scale] = await Promise.all([getQuiz(user.userId, review.quizId), getUserById(review.studentId), getGradeScale(user.companyId)])
  if (!quiz || quiz.courseId !== course.id) notFound()
  const t = await getT()
  const forms = Object.fromEntries(
    review.questions
      .filter((q) => q.type === 'essay' || q.result === 'needsgrading')
      .map((q) => [q.slot, <GradeAnswer key={q.slot} attemptId={review.id} slot={q.slot} maxMark={q.maxMark} mark={q.mark} comment={q.comment} />]),
  )
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CourseQuizHeader course={course} back={{ href: `/courses/${course.id}/quizzes/${quiz.id}/results`, label: t.quiz.results.title }} />
      <h2 className="text-xl font-semibold tracking-tight">
        {student?.name} · {quiz.name}
      </h2>
      <QuizReview
        review={review}
        passMark={quiz.passMark}
        grade={
          review.grade === null
            ? undefined
            : { label: formatGrade(review.grade, scale), outOf: scaleMax(scale) }
        }
        gradeForms={forms}
      />
    </div>
  )
}
