import Link from 'next/link'
import { QuizKindBadge } from '@/entities/quiz'
import { courseQuizzes } from '@/entities/quiz/server'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { getT } from '@/shared/i18n/server'
import { CourseQuizHeader, courseForQuizzes } from './shared'

/** Teacher: the course's quizzes and exams. */
export async function CourseQuizzesPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user, course } = await courseForQuizzes((await params).courseId)
  const t = await getT()
  const s = t.quiz.list
  const quizzes = await courseQuizzes(user.userId, course.id)
  const now = Math.floor(Date.now() / 1000)
  const newQuiz = (
    <Button asChild>
      <Link href={`/courses/${course.id}/quizzes/new`}>
        <Icon name="plus" />
        {s.new}
      </Link>
    </Button>
  )
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <CourseQuizHeader course={course} />
      {quizzes.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="check" />
            </EmptyMedia>
            <EmptyTitle>{s.emptyTitle}</EmptyTitle>
            <EmptyDescription>{s.empty}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newQuiz}</EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex justify-end">{newQuiz}</div>
          <div className="flex flex-col gap-3">
            {quizzes.map((q) => (
              <Card key={q.id} size="sm">
                <CardContent className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/courses/${course.id}/quizzes/${q.id}`} className="font-medium hover:underline">
                        {q.name}
                      </Link>
                      <QuizKindBadge kind={q.kind} />
                      {!q.published && <Badge variant="secondary">{t.courses.draft}</Badge>}
                      {q.published && q.opensAt && q.opensAt > now && (
                        <Badge variant="info">
                          {s.scheduled} <LocalTime seconds={q.opensAt} />
                        </Badge>
                      )}
                      {q.toGrade > 0 && <Badge variant="warning">{s.toGrade(q.toGrade)}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.questions(q.questionCount)} · {s.attempts(q.attemptCount)}
                      {q.timeLimit > 0 && <> · {s.minutes(Math.round(q.timeLimit / 60))}</>}
                      {q.closesAt && (
                        <>
                          {' '}· {s.closes} <LocalTime seconds={q.closesAt} />
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/courses/${course.id}/quizzes/${q.id}/results`}>{s.results}</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/courses/${course.id}/quizzes/${q.id}`}>{s.edit}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
