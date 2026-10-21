import Link from 'next/link'
import { courseQuizzes } from '@/entities/quiz/server'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'
import { managerSpace } from './shared'

/** Manager: the school's exams without a course (entrance exams, placement tests …). */
export async function SchoolExamsPage() {
  const { user, spaceId } = await managerSpace()
  const t = await getT()
  const s = t.exams
  const exams = await courseQuizzes(user.userId, spaceId)
  const now = Math.floor(Date.now() / 1000)
  const newExam = (
    <Button asChild>
      <Link href="/school/exams/new">
        <Icon name="plus" />
        {s.new}
      </Link>
    </Button>
  )
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ScreenHead title={s.title} sub={s.sub} />
        {exams.length > 0 && newExam}
      </div>
      {exams.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="check" />
            </EmptyMedia>
            <EmptyTitle>{s.emptyTitle}</EmptyTitle>
            <EmptyDescription>{s.empty}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newExam}</EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {exams.map((q) => (
            <Card key={q.id} size="sm">
              <CardContent className="flex flex-row flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/school/exams/${q.id}`} className="font-medium hover:underline">
                      {q.name}
                    </Link>
                    {!q.published && <Badge variant="secondary">{t.courses.draft}</Badge>}
                    {q.published && q.opensAt && q.opensAt > now && (
                      <Badge variant="info">
                        {t.quiz.list.scheduled} <LocalTime seconds={q.opensAt} />
                      </Badge>
                    )}
                    {q.toGrade > 0 && <Badge variant="warning">{t.quiz.list.toGrade(q.toGrade)}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.quiz.list.questions(q.questionCount)} · {t.quiz.list.attempts(q.attemptCount)}
                    {q.timeLimit > 0 && <> · {t.quiz.list.minutes(Math.round(q.timeLimit / 60))}</>}
                    {q.passMark > 0 && <> · {s.passMark(q.passMark)}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/school/exams/${q.id}/results`}>{t.quiz.list.results}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/school/exams/${q.id}`}>{t.quiz.list.edit}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
