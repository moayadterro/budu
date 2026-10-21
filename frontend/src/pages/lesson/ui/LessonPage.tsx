import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LessonItemIcon, LessonMaterials } from '@/entities/course'
import { getCourse } from '@/entities/course/server'
import { HomeworkStatusBadge } from '@/entities/homework'
import { myHomework } from '@/entities/homework/server'
import { requireRole } from '@/entities/session/server'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { cn } from '@/shared/lib/cn'
import { getGradeScale } from '@/entities/tenant/server'
import { getT } from '@/shared/i18n/server'

/** Student: one lesson — videos (streamed), text pages, documents, homework; course contents alongside. */
export async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const user = await requireRole('student')
  const p = await params
  const courseId = Number(p.courseId)
  const lessonId = Number(p.lessonId)
  if (!Number.isSafeInteger(courseId) || !Number.isSafeInteger(lessonId)) notFound()
  const [course, homework] = await Promise.all([getCourse(user.userId, courseId), myHomework(user.userId, courseId)])
  const index = course?.lessons.findIndex((l) => l.id === lessonId) ?? -1
  if (!course || index < 0) notFound()
  const lesson = course.lessons[index]
  const prev = course.lessons[index - 1]
  const next = course.lessons[index + 1]
  const t = await getT()
  const scale = await getGradeScale(user.companyId)
  const s = t.learn

  const tasks = homework.filter((h) => h.lessonId === lesson.id)

  return (
    <>
      <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
        <Link href={`/classes/${courseId}`}>
          <Icon name="back" className="rtl:-scale-x-100" />
          {s.back}
        </Link>
      </Button>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              {course.title} · {index + 1}/{course.lessons.length}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
            {lesson.description && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{lesson.description}</p>}
          </div>

          <LessonMaterials lesson={lesson} materialsLabel={s.materials} />

          {tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{s.inLesson}</CardTitle>
              </CardHeader>
              <CardContent className="gap-2">
                {tasks.map((h) => (
                  <Item key={h.id} variant="outline" size="sm" asChild>
                    <Link href={`/classes/${courseId}/homework/${h.id}`}>
                      <ItemMedia>
                        <LessonItemIcon kind="task" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{h.title}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <HomeworkStatusBadge scale={scale} status={h.status} grade={h.grade} dueAt={h.dueAt} submittedAt={h.submittedAt} />
                      </ItemActions>
                    </Link>
                  </Item>
                ))}
              </CardContent>
            </Card>
          )}

          {lesson.items.filter((x) => x.kind !== 'task').length + tasks.length === 0 && <p className="text-sm text-muted-foreground">{s.nothingYet}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {prev && (
              <Button variant="outline" asChild>
                <Link href={`/classes/${courseId}/lessons/${prev.id}`}>
                  <Icon name="back" className="rtl:-scale-x-100" />
                  {s.prev}
                </Link>
              </Button>
            )}
            {next && (
              <Button className="ms-auto" asChild>
                <Link href={`/classes/${courseId}/lessons/${next.id}`}>
                  {s.next}
                  <Icon name="chevRight" className="rtl:-scale-x-100" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Card size="sm" className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>{s.contents}</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            {course.lessons.map((l, i) => (
              <Link
                key={l.id}
                href={`/classes/${courseId}/lessons/${l.id}`}
                aria-current={l.id === lesson.id ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted',
                  l.id === lesson.id && 'bg-primary/10 font-medium text-primary',
                )}
              >
                <span className="grid size-6 flex-none place-items-center rounded-md bg-muted text-xs tabular-nums">{i + 1}</span>
                <span className="min-w-0 truncate">{l.title}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
