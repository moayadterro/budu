import Link from 'next/link'
import { outcomeOf } from '@/entities/quiz'
import { examAudience, quizResults } from '@/entities/quiz/server'
import { getGradeScale, pendingInvitesOf } from '@/entities/tenant/server'
import { InviteToSchool } from '@/features/school-exams'
import { cn } from '@/shared/lib/cn'
import { formatGrade, scaleMax } from '@/shared/lib/grade-scale'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { getT } from '@/shared/i18n/server'
import { BackLink, managerExam } from './shared'

/** Manager: who took the exam, passed or not, and inviting those who passed into the school. */
export async function SchoolExamResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { user, companyId, quiz } = await managerExam((await params).quizId)
  const t = await getT()
  const s = t.exams.results
  const [results, audience, invites, scale] = await Promise.all([
    quizResults(user.userId, quiz.id),
    examAudience(user.userId, companyId, quiz.id),
    pendingInvitesOf(companyId),
    getGradeScale(companyId),
  ])
  const takers = new Map(audience.map((a) => [a.id, a]))
  const invited = new Set(invites.map((i) => i.userId))
  const rows = (results?.students ?? [])
    .map((x) => ({ ...x, taker: takers.get(x.id), outcome: x.grade === null ? null : outcomeOf(x.grade, quiz.passMark) }))
    .sort((a, b) => (b.grade ?? -1) - (a.grade ?? -1))
  const passed = rows.filter((r) => r.outcome && r.outcome !== 'failed')
  const canInvite = passed.filter((r) => r.taker && !r.taker.member && !invited.has(r.id)).map((r) => r.id)
  const graded = rows.filter((r) => r.grade !== null)

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <BackLink href={`/school/exams/${quiz.id}`} label={quiz.name} />
      <Card>
        <CardHeader>
          <CardTitle>
            {t.quiz.results.title}: {quiz.name}
          </CardTitle>
          <CardDescription>
            {t.quiz.results.summary(graded.length, rows.length)} · {s.passedCount(passed.length, graded.length)}
            {quiz.passMark > 0 && <> · {t.exams.passMark(quiz.passMark)}</>}
          </CardDescription>
          {canInvite.length > 0 && (
            <CardAction>
              <InviteToSchool quizId={quiz.id} userIds={canInvite} all />
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">{t.quiz.results.noStudents}</p>}
          {rows.map((x) => (
            <div key={x.id} className="flex flex-wrap items-center gap-3 border-b py-2 last:border-0">
              <PersonAvatar person={x} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{x.name}</span>
                  {x.taker && !x.taker.member && <Badge variant="info">{t.exams.audience.candidate}</Badge>}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {x.email}
                  {x.submittedAt && (
                    <>
                      {' '}· <LocalTime seconds={x.submittedAt} />
                    </>
                  )}
                </div>
              </div>
              {x.grade === null ? (
                <span className="text-sm text-muted-foreground">{t.quiz.results.state[x.state]}</span>
              ) : (
                <span className={cn('flex items-center gap-1 font-semibold tabular-nums', x.outcome === 'failed' ? 'text-destructive' : 'text-success')} title={`${Math.round(x.grade)}%`}>
                  <Icon name={x.outcome === 'failed' ? 'close' : x.outcome === 'excellent' ? 'star' : 'tick'} className="size-3.5" />
                  {formatGrade(x.grade, scale)}
                  {scaleMax(scale) && <span className="text-xs font-normal text-muted-foreground">{scaleMax(scale)!.replace(/\s+/g, '')}</span>}
                </span>
              )}
              {x.taker && !x.taker.member && x.outcome && x.outcome !== 'failed' && (invited.has(x.id) ? <Badge variant="secondary">{s.alreadyInvited}</Badge> : <InviteToSchool quizId={quiz.id} userIds={[x.id]} />)}
              {x.taker?.member && <Badge variant="secondary">{s.inSchool}</Badge>}
              {x.attemptId > 0 && (
                <Button variant={x.state === 'needsgrading' ? 'default' : 'ghost'} size="sm" asChild>
                  <Link href={`/school/exams/${quiz.id}/attempts/${x.attemptId}`}>{x.state === 'needsgrading' ? t.quiz.results.grade : t.quiz.results.open}</Link>
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
