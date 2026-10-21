import Link from 'next/link'
import { examAudience } from '@/entities/quiz/server'
import { listClasses } from '@/entities/school-class/server'
import { schoolPeople } from '@/entities/tenant/server'
import { PublishQuiz, QuizQuestions, QuizSettingsForm } from '@/features/edit-quiz'
import { AudienceEditor } from '@/features/school-exams'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { getT } from '@/shared/i18n/server'
import { BackLink, managerExam } from './shared'

/** Manager: one school exam — questions, who takes it, publish, settings. */
export async function SchoolExamPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { user, companyId, quiz } = await managerExam((await params).quizId)
  const t = await getT()
  const [audience, classes, people] = await Promise.all([
    examAudience(user.userId, companyId, quiz.id),
    listClasses(user.userId, companyId),
    schoolPeople(user.userId, companyId),
  ])
  const given = new Set(audience.map((a) => a.id))
  const students = people.filter((p) => p.role === 'student' && !p.pending && !given.has(p.id))
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/school/exams" label={t.exams.title} />
      <h1 className="text-2xl font-semibold tracking-tight">{quiz.name}</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.quiz.q.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuizQuestions quizId={quiz.id} questions={quiz.questions} editable={quiz.editable} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.exams.audience.title}</CardTitle>
              <CardDescription>{t.exams.audience.sub}</CardDescription>
            </CardHeader>
            <CardContent>
              <AudienceEditor
                quizId={quiz.id}
                audience={audience}
                classes={classes.map((k) => ({ id: k.id, name: k.name, studentCount: k.studentCount }))}
                students={students.map((p) => ({ id: p.id, name: p.name, email: p.email, pictureId: p.pictureId }))}
              />
            </CardContent>
          </Card>
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t.quiz.publish.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <PublishQuiz quizId={quiz.id} courseId={quiz.courseId} published={quiz.published} opensAt={quiz.opensAt} base="/school/exams" />
              <Button variant="outline" asChild>
                <Link href={`/school/exams/${quiz.id}/results`}>{t.quiz.list.results}</Link>
              </Button>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t.quiz.settings.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuizSettingsForm key={quiz.id} courseId={quiz.courseId} quiz={quiz} classes={[]} base="/school/exams" examOnly />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
