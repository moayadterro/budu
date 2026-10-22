import { LocalLink as Link } from '@/shared/ui/local-link'
import { notFound } from 'next/navigation'
import { LessonMaterials } from '@/entities/course'
import { previewLesson } from '@/entities/course/server'
import { getSession } from '@/entities/session/server'
import { getCurrency, visitorCurrency } from '@/entities/user/server'
import { catalogFor } from '@/widgets/course-catalog/server'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/**
 * Public: the free preview of a marketplace course — lesson 1 (usually the intro) for anyone, even
 * without an account. Every other lesson is locked: visitors are asked to sign up (free courses too).
 */
export async function CoursePreviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const user = await getSession()
  // only marketplace courses have a public preview
  const items = await catalogFor(user?.userId ?? 0, user ? await getCurrency(user.userId) : await visitorCurrency())
  const item = items.find((i) => i.course.id === id)
  const lesson = item ? await previewLesson(id) : null
  if (!item || !lesson) notFound()
  const { course, price } = item
  const t = await getT()
  const s = t.preview
  const total = course.lessons.length
  const student = user?.role === 'student'
  const courseHref = student ? `/explore/${id}` : `/catalog/${id}`

  return (
    <>
      <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
        <Link href={courseHref}>
          <Icon name="back" className="rtl:-scale-x-100" />
          {s.back}
        </Link>
      </Button>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{s.tag}</Badge>
              <span className="text-xs font-medium uppercase tracking-wider text-primary">
                {course.title} · {s.lessonOf(total)}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
            {lesson.description && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{lesson.description}</p>}
          </div>
          <LessonMaterials lesson={lesson} materialsLabel={t.learn.materials} />
          {lesson.items.length === 0 && <p className="text-sm text-muted-foreground">{s.nothing}</p>}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle>{s.nextTitle}</CardTitle>
              <CardDescription>
                {student ? s.nextStudent(total) : price.free ? s.nextFree(total) : s.nextPaid(total)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {!user ? (
                <>
                  <Button asChild>
                    <Link href="/register">{price.free ? t.catalog.signUpFree : t.catalog.signUpBuy}</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    {/* signing in comes back to this course, ready to enrol */}
                    <Link href={`/login?next=${encodeURIComponent(`/catalog/${id}`)}`}>{t.catalog.haveAccount}</Link>
                  </Button>
                </>
              ) : student && course.enrolled ? (
                <Button asChild>
                  <Link href={`/classes/${id}`}>{s.open}</Link>
                </Button>
              ) : student ? (
                <Button asChild>
                  <Link href={`/explore/${id}`}>{s.join}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>{t.learn.contents}</CardTitle>
            </CardHeader>
            <CardContent className="gap-1">
              {course.lessons.map((title, i) => {
                const row = (
                  <>
                    <span className="grid size-6 flex-none place-items-center rounded-md bg-muted text-xs tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{title}</span>
                    {i > 0 && <Icon name="lock" className="size-4 flex-none" aria-label={user ? s.locked : s.signInToOpen} />}
                  </>
                )
                if (i === 0)
                  return (
                    <div key={i} aria-current="page" className="flex items-center gap-3 rounded-md bg-primary/10 px-2 py-2 text-sm font-medium text-primary">
                      {row}
                    </div>
                  )
                // visitors: a locked lesson → sign in, then back to this course
                return user ? (
                  <div key={i} className="flex items-center gap-3 px-2 py-2 text-sm text-muted-foreground">
                    {row}
                  </div>
                ) : (
                  <Link
                    key={i}
                    href={`/login?next=${encodeURIComponent(`/catalog/${id}`)}`}
                    title={s.signInToOpen}
                    className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {row}
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
