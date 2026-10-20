'use client'

import type { Course } from '@/entities/course'
import { initialsOf } from '@/entities/session'
import { CourseDetailsForm, PublishToggle } from '@/features/edit-course'
import { AddLessonContent, ItemActions } from '@/features/edit-lesson-content'
import { AddLesson, LessonHeader } from '@/features/edit-lessons'
import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { Separator } from '@/shared/ui/separator'
import { useT } from '@/shared/i18n'
import { LessonItemView } from './LessonItemView'

/** Teacher's course editor: publish status, details, then lessons with their videos, PDFs and tasks. */
export function CourseBuilder({ course, authorName }: { course: Course; authorName: string }) {
  const t = useT()
  const s = t.courses
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-w-0 flex-col gap-4 lg:order-1">
        <h2 className="text-base font-semibold">{s.lessons}</h2>
        {course.lessons.length === 0 && <p className="text-sm text-muted-foreground">{s.noLessons}</p>}
        {course.lessons.map((lesson, i) => (
          <Card key={lesson.id} size="sm">
            <CardHeader>
              <LessonHeader
                courseId={course.id}
                lesson={lesson}
                number={i + 1}
                isFirst={i === 0}
                isLast={i === course.lessons.length - 1}
              />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {lesson.items.length === 0 && <p className="text-sm text-muted-foreground">{s.emptyLesson}</p>}
              {lesson.items.map((item) => (
                <ItemActions key={item.id} courseId={course.id} lessonId={lesson.id} item={item}>
                  <LessonItemView item={item} />
                </ItemActions>
              ))}
              <Separator className="my-1" />
              <AddLessonContent courseId={course.id} lessonId={lesson.id} />
            </CardContent>
          </Card>
        ))}
        <AddLesson courseId={course.id} />
      </section>

      <aside className="flex flex-col gap-4 lg:order-2 lg:sticky lg:top-20">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{s.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <PublishToggle course={course} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t.teach.studentsTitle}</CardTitle>
            <CardDescription>{t.teach.studentsSub}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/teach/classes/${course.id}`}>
                <Icon name="users" />
                {t.teach.manageStudents}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{s.details}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <InitialsAvatar initials={initialsOf(authorName)} color="var(--color-primary)" className="size-5 text-[10px]" />
              {s.author} {authorName} · {s.underName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseDetailsForm course={course} />
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
