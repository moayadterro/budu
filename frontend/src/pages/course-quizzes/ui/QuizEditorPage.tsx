import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QuizKindBadge } from '@/entities/quiz'
import { getQuiz } from '@/entities/quiz/server'
import { PublishQuiz, QuizQuestions, QuizSettingsForm } from '@/features/edit-quiz'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getT } from '@/shared/i18n/server'
import { CourseQuizHeader, courseClasses, courseForQuizzes } from './shared'

/** Teacher: write a quiz's questions, publish it, change its settings. */
export async function QuizEditorPage({ params }: { params: Promise<{ courseId: string; quizId: string }> }) {
  const p = await params
  const { user, course } = await courseForQuizzes(p.courseId)
  const quiz = await getQuiz(user.userId, Number(p.quizId))
  if (!quiz || quiz.courseId !== course.id) notFound()
  const t = await getT()
  const classes = await courseClasses(user, course.id)
  return (
    <div className="flex flex-col gap-6">
      <CourseQuizHeader course={course} back={{ href: `/courses/${course.id}/quizzes`, label: t.quiz.list.back }} />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{quiz.name}</h2>
        <QuizKindBadge kind={quiz.kind} />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle>{t.quiz.q.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <QuizQuestions quizId={quiz.id} questions={quiz.questions} editable={quiz.editable} />
          </CardContent>
        </Card>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t.quiz.publish.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <PublishQuiz quizId={quiz.id} courseId={course.id} published={quiz.published} opensAt={quiz.opensAt} base={`/courses/${course.id}/quizzes`} />
              <Button variant="outline" asChild>
                <Link href={`/courses/${course.id}/quizzes/${quiz.id}/results`}>{t.quiz.list.results}</Link>
              </Button>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t.quiz.settings.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuizSettingsForm key={`${quiz.id}`} courseId={course.id} quiz={quiz} classes={classes} base={`/courses/${course.id}/quizzes`} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
