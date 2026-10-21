import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnnouncementsCard } from '@/entities/announcement'
import { listAnnouncements } from '@/entities/announcement/server'
import { getCourse, myCourses } from '@/entities/course/server'
import { QuizStateBadge } from '@/entities/quiz'
import { myQuizzes } from '@/entities/quiz/server'
import { HomeworkStatusBadge } from '@/entities/homework'
import { myHomework } from '@/entities/homework/server'
import { ratingAsk } from '@/entities/review/server'
import { requireRole } from '@/entities/session/server'
import { RateCourseCard } from '@/features/rate-course'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { getGradeScale } from '@/entities/tenant/server'
import { getT } from '@/shared/i18n/server'

/** Student: one course — its announcements, lessons, homework and quizzes. Live IOMAD data. */
export async function ClassHubPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole('student')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const [course, homework, mine, news] = await Promise.all([
    getCourse(user.userId, id),
    myHomework(user.userId, id),
    myCourses(user.userId),
    listAnnouncements({ courses: [id] }, 3),
  ])
  const [quizzes, ask] = await Promise.all([myQuizzes(user.userId, id), ratingAsk(user.userId, id)])
  const openQuizzes = quizzes.filter((q) => q.canStart || q.state === 'inprogress').length
  if (!course) notFound()
  const t = await getT()
  const scale = await getGradeScale(user.companyId)
  const s = t.learn
  const teachers = mine.find((c) => c.id === id)?.teachers ?? ''
  const todo = homework.filter((h) => h.status === 'new').length

  return (
    <>
      <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
        <Link href="/classes">
          <Icon name="back" className="rtl:-scale-x-100" />
          {s.coursesTitle}
        </Link>
      </Button>
      <div className="mb-6 flex items-center gap-4">
        <span className="grid size-14 flex-none place-items-center rounded-xl bg-brand text-primary-foreground">
          <Icon name="book" className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            {teachers && `${t.withTeacher} ${teachers} · `}
            {t.courses.lessonCount(course.lessons.length)}
          </p>
        </div>
      </div>
      {course.description && <p className="mb-6 max-w-3xl whitespace-pre-line text-sm text-muted-foreground">{course.description}</p>}
      {/* finished: ask for a rating until they rate or say "Not now" */}
      {ask.finished && !ask.mine && !ask.dismissed && (
        <div className="mb-6 max-w-xl">
          <RateCourseCard courseId={id} courseTitle={course.title} mine={null} />
        </div>
      )}

      {news.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <AnnouncementsCard items={news} />
        </div>
      )}

      <Tabs defaultValue="lessons" className="gap-4">
        <TabsList>
          <TabsTrigger value="lessons">{s.lessonsTab}</TabsTrigger>
          <TabsTrigger value="homework">
            {s.homeworkTab}
            {todo > 0 && <span className="ms-1 rounded-full bg-warning/15 px-1.5 text-xs text-warning tabular-nums">{todo}</span>}
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            {t.quiz.list.tab}
            {openQuizzes > 0 && <span className="ms-1 rounded-full bg-info/15 px-1.5 text-xs text-info tabular-nums">{openQuizzes}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes">
          <Card className="py-2">
            <CardContent className="gap-1 px-2">
              {quizzes.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">{t.quiz.list.noneStudent}</p>}
              {quizzes.map((q) => (
                <Item key={q.id} size="sm" asChild>
                  <Link href={`/classes/${id}/quizzes/${q.id}`}>
                    <ItemMedia variant="icon" className={q.kind === 'exam' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'}>
                      <Icon name="check" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{q.name}</ItemTitle>
                      <ItemDescription className="truncate">
                        {t.quiz.kind[q.kind]}
                        {q.closesAt && (
                          <>
                            {' '}· {t.quiz.list.closes} <LocalTime seconds={q.closesAt} />
                          </>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <QuizStateBadge quiz={q} />
                    </ItemActions>
                  </Link>
                </Item>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons">
          <Card className="py-2">
            <CardContent className="gap-1 px-2">
              {course.lessons.length === 0 && <p className="p-4 text-sm text-muted-foreground">{s.noLessons}</p>}
              {course.lessons.map((l, i) => {
                const videos = l.items.filter((x) => x.kind === 'video').length
                const tasks = l.items.filter((x) => x.kind === 'task').length
                return (
                  <Item key={l.id} size="sm" asChild>
                    <Link href={`/classes/${id}/lessons/${l.id}`}>
                      <ItemMedia>
                        <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                          {i + 1}
                        </span>
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="truncate">{l.title}</ItemTitle>
                        <ItemDescription className="flex gap-3">
                          {videos > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="video" className="size-3.5" /> {videos}
                            </span>
                          )}
                          {l.items.length - videos - tasks > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="file" className="size-3.5" /> {l.items.length - videos - tasks}
                            </span>
                          )}
                          {tasks > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="task" className="size-3.5" /> {tasks}
                            </span>
                          )}
                        </ItemDescription>
                      </ItemContent>
                      <Icon name="chevRight" className="size-4 text-muted-foreground rtl:-scale-x-100" />
                    </Link>
                  </Item>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework">
          <Card className="py-2">
            <CardContent className="gap-1 px-2">
              {homework.length === 0 && <p className="p-4 text-sm text-muted-foreground">{s.noHomework}</p>}
              {homework.map((h) => (
                <Item key={h.id} size="sm" asChild>
                  <Link href={`/classes/${id}/homework/${h.id}`}>
                    <ItemMedia variant="icon">
                      <Icon name="task" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{h.title}</ItemTitle>
                      <ItemDescription className="truncate">
                        {h.lessonTitle} ·{' '}
                        {h.dueAt ? (
                          <>
                            {t.hw.due} <LocalTime seconds={h.dueAt} />
                          </>
                        ) : (
                          t.hw.noDue
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <HomeworkStatusBadge scale={scale} status={h.status} grade={h.grade} dueAt={h.dueAt} submittedAt={h.submittedAt} />
                    </ItemActions>
                  </Link>
                </Item>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
