import { QuizSettingsForm } from '@/features/edit-quiz'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { getT } from '@/shared/i18n/server'
import { CourseQuizHeader, courseClasses, courseForQuizzes } from './shared'

/** Teacher: a new quiz / exam — settings first, then questions. */
export async function QuizNewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user, course } = await courseForQuizzes((await params).courseId)
  const t = await getT()
  const classes = await courseClasses(user, course.id)
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CourseQuizHeader course={course} back={{ href: `/courses/${course.id}/quizzes`, label: t.quiz.list.back }} />
      <Card>
        <CardHeader>
          <CardTitle>{t.quiz.list.new}</CardTitle>
          <CardDescription>{t.quiz.settings.newSub}</CardDescription>
        </CardHeader>
        <CardContent>
          <QuizSettingsForm courseId={course.id} classes={classes} base={`/courses/${course.id}/quizzes`} />
        </CardContent>
      </Card>
    </div>
  )
}
