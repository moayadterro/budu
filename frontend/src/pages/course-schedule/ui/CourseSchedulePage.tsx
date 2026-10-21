import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourse } from '@/entities/course/server'
import { courseSeries } from '@/entities/schedule/server'
import { listClasses } from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { isSchool } from '@/entities/tenant/server'
import { AddLessonsForm, DeleteSeriesButton } from '@/features/schedule-lessons'
import { CourseTabs } from '@/widgets/course-builder'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Teacher: the course's weekly lessons (whole course or per enrolled class) — they fill the timetable. */
export async function CourseSchedulePage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole('teacher')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const course = await getCourse(user.userId, id)
  if (!course?.canEdit) notFound()
  const t = await getT()
  const s = t.schedule
  const [series, classes] = await Promise.all([
    courseSeries(user.userId, id),
    (await isSchool(user.companyId)) && user.companyId ? listClasses(user.userId, user.companyId) : Promise.resolve([]),
  ])
  const enrolled = classes.filter((c) => c.courseIds.includes(id)).map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
          <Link href="/courses">
            <Icon name="back" className="rtl:-scale-x-100" />
            {t.courses.back}
          </Link>
        </Button>
        <ScreenHead title={course.title} sub={s.sub} />
        <CourseTabs courseId={id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{s.title}</CardTitle>
          <CardDescription>{s.sub}</CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          {series.length === 0 && <p className="text-sm text-muted-foreground">{s.none}</p>}
          {series.map((x) => (
            <Item key={x.id} variant="outline" size="sm">
              <ItemMedia variant="icon">
                <Icon name="cal" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <LocalTime seconds={x.first} /> · {s.minutes(Math.round(x.duration / 60))}
                </ItemTitle>
                <ItemDescription>
                  {[x.className || s.wholeCourse, s.lessons(x.count), x.description].filter(Boolean).join(' · ')}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <DeleteSeriesButton courseId={id} seriesId={x.id} count={x.count} />
              </ItemActions>
            </Item>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{s.add}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddLessonsForm courseId={id} classes={enrolled} />
        </CardContent>
      </Card>
    </div>
  )
}
