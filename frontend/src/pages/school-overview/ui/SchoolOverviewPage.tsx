import Link from 'next/link'
import { requireRole } from '@/entities/session/server'
import { AnnouncementsCard } from '@/entities/announcement'
import { listAnnouncements } from '@/entities/announcement/server'
import { listClasses } from '@/entities/school-class/server'
import { getTenantName, isSchool, schoolCourses, schoolPeople } from '@/entities/tenant/server'
import { DeleteAnnouncementButton, NewAnnouncementDialog } from '@/features/announcements'
import { StatTile } from '@/widgets/teacher-overview'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** School manager home: numbers, people, courses. Live IOMAD data. */
export async function SchoolOverviewPage() {
  const user = await requireRole('manager')
  const t = await getT()
  const s = t.school
  if (!user.companyId) return <ScreenHead title={t.nav.school} sub={s.overviewSub} />
  const [name, people, courses, inSchool, news, classes] = await Promise.all([
    getTenantName(user.companyId),
    schoolPeople(user.userId, user.companyId),
    schoolCourses(user.userId, user.companyId),
    isSchool(user.companyId),
    listAnnouncements({ allOf: [user.companyId] }, 10), // everything in the school: whole school, classes, courses
    listClasses(user.userId, user.companyId),
  ])
  const count = (role: string) => people.filter((p) => p.role === role).length

  return (
    <>
      <ScreenHead eyebrow={t.nav.school} title={name ?? t.nav.school} sub={s.overviewSub} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon="users" label={s.stats.teachers} value={count('teacher')} note={s.stats.teachersSub} />
        <StatTile icon="users" label={s.stats.students} value={count('student')} note={s.stats.studentsSub} />
        <StatTile icon="book" label={s.stats.courses} value={courses.length} note={s.stats.coursesSub(courses.filter((c) => c.published).length)} />
        <StatTile icon="task" label={s.stats.homework} value={courses.reduce((n, c) => n + c.homework, 0)} note={s.stats.homeworkSub} />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{s.recentPeople}</CardTitle>
            <CardAction>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/school/people">{t.viewAll}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="gap-1">
            {people.length === 0 && <p className="text-sm text-muted-foreground">{s.noPeople}</p>}
            {people.slice(0, 6).map((p) => (
              <Item key={p.id} size="sm" className="px-0">
                <ItemMedia>
                  <PersonAvatar person={p} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{p.name}</ItemTitle>
                  <ItemDescription className="truncate">{p.email}</ItemDescription>
                </ItemContent>
                <Badge variant="secondary">{t.role[p.role]}</Badge>
              </Item>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{s.recentCourses}</CardTitle>
            <CardAction>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/school/courses">{t.viewAll}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="gap-1">
            {courses.length === 0 && <p className="text-sm text-muted-foreground">{s.noCourses}</p>}
            {courses.slice(0, 6).map((c) => (
              <Item key={c.id} size="sm" className="px-0">
                <ItemMedia className="size-9 rounded-md bg-brand text-xs font-semibold text-primary-foreground">
                  {c.title.slice(0, 2).toUpperCase()}
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{c.title}</ItemTitle>
                  <ItemDescription className="truncate">
                    {c.teachers || '—'} · {t.teach.studentCount(c.students)}
                  </ItemDescription>
                </ItemContent>
                <Badge variant={c.published ? 'success' : 'secondary'}>{c.published ? t.courses.published : t.courses.draft}</Badge>
              </Item>
            ))}
          </CardContent>
        </Card>
      </div>
      {inSchool && (
        <div className="mt-6">
          <AnnouncementsCard
            items={news}
            sub={t.announcements.sub}
            action={<NewAnnouncementDialog classes={classes.map((k) => ({ id: k.id, name: k.name }))} />}
            itemActions={Object.fromEntries(news.map((a) => [a.id, <DeleteAnnouncementButton key={a.id} announcementId={a.id} />]))}
          />
        </div>
      )}
    </>
  )
}
