import Link from 'next/link'
import { ScreenHead } from '@/shared/ui/screen-head'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { Icon } from '@/shared/ui/icon'
import { requireRole } from '@/entities/session/server'
import { StudentCourseCard } from '@/entities/course'
import { myCourses } from '@/entities/course/server'
import { HomeworkStatusBadge } from '@/entities/homework'
import { myHomework } from '@/entities/homework/server'
import { myClasses } from '@/entities/school-class/server'
import { myWeek } from '@/entities/schedule/server'
import { NextLessonCard, SchoolEventsCard, TodayCard } from '@/widgets/week-calendar'
import { LocalTime } from '@/shared/ui/local-time'
import { getGradeScale, getTenantName, invitesFor, isSchool } from '@/entities/tenant/server'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { AnnouncementsCard } from '@/entities/announcement'
import { listAnnouncements } from '@/entities/announcement/server'
import { getFamily, requestsOfChild } from '@/entities/family/server'
import { QuizStateBadge } from '@/entities/quiz'
import { myQuizzes } from '@/entities/quiz/server'
import { getLocale, getT } from '@/shared/i18n/server'

/** Student dashboard. */
export async function HomePage() {
  const t = await getT()
  const user = await requireRole('student')
  const scale = await getGradeScale(user.companyId)
  const firstName = user.name.split(' ')[0] ?? ''
  const nowSec = Math.floor(Date.now() / 1000)
  const [courses, homework, classes, locale, invites, agenda, family, sentToParents, news, quizzes] = await Promise.all([
    myCourses(user.userId),
    myHomework(user.userId),
    myClasses(user.userId),
    getLocale(),
    invitesFor(user.userId),
    myWeek(user.userId, nowSec - 86400, nowSec + 8 * 86400),
    getFamily(user.userId),
    requestsOfChild(user.userId),
    listAnnouncements({ schools: user.companyId ? [user.companyId] : [] }, 5),
    myQuizzes(user.userId),
  ])
  // quizzes / exams to take now, closing soonest first
  const openQuizzes = quizzes
    .filter((q) => q.canStart || q.state === 'inprogress')
    .sort((a, b) => (a.closesAt ?? Infinity) - (b.closesAt ?? Infinity))
    .slice(0, 5)
  // school-wide news + their class's + their courses' (fetched after: needs the class and course ids)
  const classNews = await listAnnouncements({ classes: classes.member.map((k) => k.id), courses: courses.map((c) => c.id) }, 5)
  const allNews = [...news, ...classNews].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6)
  const today = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  // "School · Class 10": their school and their class (at most one); solo students get no line
  const school = (await isSchool(user.companyId)) ? await getTenantName(user.companyId) : null
  const classLine = [school, classes.member[0]?.name].filter(Boolean).join(' · ') || undefined
  // what's still to hand in, soonest due first (no due date last)
  const due = homework
    .filter((h) => h.status === 'new')
    .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))
    .slice(0, 5)
  return (
    <>
      <ScreenHead eyebrow={today} title={t.home.hi(firstName)} sub={classLine} />
      {invites.length > 0 && (
        <Alert variant="info" className="mb-6">
          <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {t.invites.banner(invites[0].school)}
            <Link href="/invites" className="font-medium underline underline-offset-4">
              {t.invites.view}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <NextLessonCard items={agenda} />
          <TodayCard items={agenda} />
          <Card>
            <CardHeader>
              <CardTitle>{t.learn.coursesTitle}</CardTitle>
              <CardAction>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link href="/classes">{t.viewAll}</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {courses.length === 0 && <p className="text-sm text-muted-foreground">{t.learn.empty}</p>}
              {courses.slice(0, 4).map((c) => (
                <StudentCourseCard key={c.id} course={c} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {family.parents.length === 0 && (
            // until a parent accepts: learning goes better with a parent following along
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="userAdd" className="text-primary" />
                  {t.family.cardTitle}
                </CardTitle>
                <CardDescription>
                  {sentToParents.length > 0 ? `${t.family.waiting}: ${sentToParents.map((r) => r.parentName).join(', ')}` : t.family.cardSub}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" asChild>
                  <Link href="/account#parents">{t.family.cardAction}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{t.home.hwTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {due.length === 0 && <p className="text-sm text-muted-foreground">{t.learn.allDone}</p>}
              {due.map((hw) => (
                <Item key={hw.id} size="sm" asChild className="px-2">
                  <Link href={`/classes/${hw.courseId}/homework/${hw.id}`}>
                    <ItemMedia variant="icon" className="bg-warning/10 text-warning">
                      <Icon name="task" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{hw.title}</ItemTitle>
                      <ItemDescription className="truncate">
                        {hw.courseTitle}
                        {hw.dueAt && (
                          <>
                            {' '}· {t.hw.due} <LocalTime seconds={hw.dueAt} />
                          </>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <HomeworkStatusBadge scale={scale} status={hw.status} grade={hw.grade} dueAt={hw.dueAt} submittedAt={hw.submittedAt} />
                  </Link>
                </Item>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.quiz.homeTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {openQuizzes.length === 0 && <p className="text-sm text-muted-foreground">{t.quiz.noneOpen}</p>}
              {openQuizzes.map((q) => (
                <Item key={q.id} size="sm" asChild className="px-2">
                  <Link href={`/classes/${q.courseId}/quizzes/${q.id}`}>
                    <ItemMedia variant="icon" className={q.kind === 'exam' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'}>
                      <Icon name="check" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{q.name}</ItemTitle>
                      <ItemDescription className="truncate">
                        {t.quiz.kind[q.kind]} · {q.courseTitle}
                        {q.closesAt && (
                          <>
                            {' '}· {t.quiz.list.closes} <LocalTime seconds={q.closesAt} />
                          </>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <QuizStateBadge quiz={q} />
                  </Link>
                </Item>
              ))}
            </CardContent>
          </Card>
          <SchoolEventsCard items={agenda} />
          <AnnouncementsCard items={allNews} />
        </div>
      </div>
    </>
  )
}
