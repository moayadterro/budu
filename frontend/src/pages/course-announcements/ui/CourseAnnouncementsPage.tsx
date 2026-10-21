import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnnouncementsCard } from '@/entities/announcement'
import { listAnnouncements } from '@/entities/announcement/server'
import { getCourse } from '@/entities/course/server'
import { requireRole } from '@/entities/session/server'
import { DeleteAnnouncementButton, NewAnnouncementDialog } from '@/features/announcements'
import { CourseTabs } from '@/widgets/course-builder'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Teacher: announcements to one course — its students and their parents. */
export async function CourseAnnouncementsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await requireRole('teacher')
  const id = Number((await params).courseId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const course = await getCourse(user.userId, id)
  if (!course?.canEdit) notFound()
  const t = await getT()
  const news = await listAnnouncements({ courses: [id] }, 50)
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
          <Link href="/courses">
            <Icon name="back" className="rtl:-scale-x-100" />
            {t.courses.back}
          </Link>
        </Button>
        <ScreenHead title={course.title} sub={t.courses.lessonCount(course.lessonCount)} />
        <CourseTabs courseId={id} />
      </div>
      <AnnouncementsCard
        items={news}
        showEmpty
        sub={t.announcements.courseSub}
        action={<NewAnnouncementDialog courseId={id} />}
        itemActions={Object.fromEntries(news.map((a) => [a.id, <DeleteAnnouncementButton key={a.id} announcementId={a.id} title={a.title} />]))}
      />
    </div>
  )
}
