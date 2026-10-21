import Link from 'next/link'
import { HomeworkStatusBadge } from '@/entities/homework'
import { listSubmissions } from '@/entities/homework/server'
import { requireRole } from '@/entities/session/server'
import { StatTile } from '@/widgets/teacher-overview'
import { teacherOverview } from '@/widgets/teacher-overview/server'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Empty, EmptyDescription, EmptyHeader } from '@/shared/ui/empty'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getGradeScale, schoolsAmong } from '@/entities/tenant/server'
import { getAccount } from '@/entities/user/server'
import { AnnouncementsCard } from '@/entities/announcement'
import { listAnnouncements } from '@/entities/announcement/server'
import { getT } from '@/shared/i18n/server'

/** Teacher home: numbers, answers waiting for a grade, courses. Live IOMAD data. */
export async function TeacherDashboardPage() {
  const user = await requireRole('teacher')
  const t = await getT()
  const scale = await getGradeScale(user.companyId)
  const s = t.teach
  const [courses, submissions, news] = await Promise.all([
    teacherOverview(user.userId, user.companyId),
    user.companyId ? listSubmissions(user.userId, user.companyId) : Promise.resolve([]),
    // a teacher may teach in several schools: announcements of all of them, grouped by school
    getAccount(user.email)
      .then((a) => schoolsAmong(a.memberships.map((m) => m.companyid)))
      .then((ids) => listAnnouncements(ids, 5)),
  ])
  const toGrade = submissions.filter((x) => x.status === 'submitted')
  const students = courses.reduce((n, c) => n + c.students, 0)
  const firstName = user.name.split(' ')[0] ?? user.name

  return (
    <>
      <ScreenHead title={s.greeting(firstName)} sub={s.sub} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon="users" label={s.stats.students} value={students} note={s.stats.studentsSub(courses.length)} />
        <StatTile icon="book" label={s.stats.courses} value={courses.length} note={s.stats.coursesSub(courses.filter((c) => c.published).length)} />
        <StatTile icon="check" label={s.stats.toGrade} value={toGrade.length} note={s.stats.toGradeSub} />
        <StatTile icon="cal" label={s.stats.dueWeek} value={courses.reduce((n, c) => n + c.dueThisWeek, 0)} note={s.stats.dueWeekSub} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{s.toGradeTitle}</CardTitle>
            {toGrade.length > 0 && (
              <CardAction>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link href="/grading">{s.openGrading}</Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="gap-1">
            {toGrade.length === 0 ? (
              <Empty className="py-6">
                <EmptyHeader>
                  <EmptyDescription>{s.toGradeEmpty}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              toGrade.slice(0, 6).map((x) => (
                <Item key={`${x.homeworkId}-${x.student.id}`} size="sm" className="px-2" asChild>
                  <Link href={`/grading?homework=${x.homeworkId}&student=${x.student.id}`}>
                    <ItemMedia>
                      <PersonAvatar person={x.student} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{x.student.name}</ItemTitle>
                      <ItemDescription className="truncate">
                        {x.homeworkTitle} · {x.courseTitle}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="flex-col items-end gap-1">
                      <HomeworkStatusBadge scale={scale} status={x.status} grade={x.grade} dueAt={x.dueAt} submittedAt={x.submittedAt} />
                      {x.submittedAt && <LocalTime seconds={x.submittedAt} className="text-xs text-muted-foreground" />}
                    </ItemActions>
                  </Link>
                </Item>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{s.coursesTitle}</CardTitle>
            <CardAction>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/courses">{t.viewAll}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="gap-1">
            {courses.length === 0 && <p className="text-sm text-muted-foreground">{s.noClasses}</p>}
            {courses.slice(0, 6).map((c) => (
              <Item key={c.id} size="sm" className="px-2" asChild>
                <Link href={`/courses/${c.id}/students`}>
                  <ItemMedia className="size-9 rounded-md bg-brand text-primary-foreground">
                    <span className="text-xs font-semibold">{c.title.slice(0, 2).toUpperCase()}</span>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="truncate">{c.title}</ItemTitle>
                    <ItemDescription>
                      {s.studentCount(c.students)} · {t.courses.lessonCount(c.lessonCount)}
                    </ItemDescription>
                  </ItemContent>
                  {c.toGrade > 0 && <Badge variant="info">{c.toGrade}</Badge>}
                </Link>
              </Item>
            ))}
          </CardContent>
        </Card>
      </div>
      {news.length > 0 && (
        <div className="mt-6">
          <AnnouncementsCard items={news} groupBySchool />
        </div>
      )}
    </>
  )
}
