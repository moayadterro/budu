import Link from 'next/link'
import { requireRole } from '@/entities/session/server'
import { CreateCourseForm } from '@/features/edit-course'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { t } from '@/shared/i18n'

/** Teacher: start a new course (title + description), then continue in the builder. */
export async function CourseNewPage() {
  await requireRole('teacher')
  const s = t.courses
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ms-2 self-start" asChild>
        <Link href="/courses">
          <Icon name="back" className="rtl:-scale-x-100" />
          {s.back}
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{s.newTitle}</CardTitle>
          <CardDescription>{s.newSub}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCourseForm />
        </CardContent>
      </Card>
    </div>
  )
}
