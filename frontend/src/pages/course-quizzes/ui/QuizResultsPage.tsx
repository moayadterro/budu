import Link from 'next/link'
import { notFound } from 'next/navigation'
import { outcomeOf } from '@/entities/quiz'
import { quizResults } from '@/entities/quiz/server'
import { getGradeScale } from '@/entities/tenant/server'
import { formatGrade } from '@/shared/lib/grade-scale'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { cn } from '@/shared/lib/cn'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { getT } from '@/shared/i18n/server'
import { CourseQuizHeader, courseForQuizzes } from './shared'

const stateVariant = { notstarted: 'secondary', inprogress: 'info', needsgrading: 'warning', finished: 'success' } as const

/** Teacher: who took the quiz, their grade, and answers to grade. */
export async function QuizResultsPage({ params }: { params: Promise<{ courseId: string; quizId: string }> }) {
  const p = await params
  const { user, course } = await courseForQuizzes(p.courseId)
  const r = await quizResults(user.userId, Number(p.quizId))
  if (!r || r.courseId !== course.id) notFound()
  const t = await getT()
  const s = t.quiz.results
  const scale = await getGradeScale(user.companyId)
  const graded = r.students.filter((x) => x.grade !== null)
  const avg = graded.length ? graded.reduce((n, x) => n + x.grade!, 0) / graded.length : null
  const passed = r.passMark > 0 ? graded.filter((x) => x.grade! >= r.passMark).length : null
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <CourseQuizHeader course={course} back={{ href: `/courses/${course.id}/quizzes/${r.id}`, label: r.name }} />
      <Card>
        <CardHeader>
          <CardTitle>
            {s.title}: {r.name}
          </CardTitle>
          <CardDescription>
            {s.summary(graded.length, r.students.length)}
            {avg !== null && <> · {s.average} {formatGrade(avg, scale)}</>}
            {passed !== null && <> · {s.passed(passed, graded.length)}</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {r.students.length === 0 && <p className="text-sm text-muted-foreground">{s.noStudents}</p>}
          {r.students.map((x) => (
            <div key={x.id} className="flex flex-wrap items-center gap-3 border-b py-2 last:border-0">
              <PersonAvatar person={x} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{x.name}</div>
                <div className="text-xs text-muted-foreground">{x.submittedAt ? <LocalTime seconds={x.submittedAt} /> : '—'}</div>
              </div>
              <Badge variant={stateVariant[x.state]}>{s.state[x.state]}</Badge>
              {x.grade === null ? (
                <span className="w-16 text-end text-muted-foreground">—</span>
              ) : (
                // colour + icon + the grade: below the pass mark red ✗, otherwise green ✓ (★ for 85%+)
                <span
                  className={cn(
                    'flex w-16 items-center justify-end gap-1 font-semibold tabular-nums',
                    outcomeOf(x.grade, r.passMark) === 'failed' ? 'text-destructive' : 'text-success',
                  )}
                  title={`${Math.round(x.grade)}%`}
                >
                  <Icon name={{ failed: 'close', passed: 'tick', excellent: 'star' }[outcomeOf(x.grade, r.passMark)] as 'close' | 'tick' | 'star'} className="size-3.5" />
                  {formatGrade(x.grade, scale)}
                </span>
              )}
              {x.attemptId > 0 && (
                <Button variant={x.state === 'needsgrading' ? 'default' : 'outline'} size="sm" asChild>
                  <Link href={`/courses/${course.id}/quizzes/${r.id}/attempts/${x.attemptId}`}>{x.state === 'needsgrading' ? s.grade : s.open}</Link>
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
