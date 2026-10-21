import { redirect } from 'next/navigation'
import { myWeek } from '@/entities/schedule/server'
import { getSession } from '@/entities/session/server'
import { isSchool } from '@/entities/tenant/server'
import { AddSchoolEventDialog } from '@/features/school-events'
import { WeekCalendar } from '@/widgets/week-calendar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

const DAY = 86400

/**
 * Timetable for every role: the week's lessons (a student's own courses / class, a teacher's courses,
 * a manager's school) and school events. Managers of a school can add events.
 */
export async function TimetablePage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await getSession()
  if (!user) redirect('/login')
  const t = await getT()
  const week = (await searchParams).week ?? null
  const m = week?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  // the browser decides its own Monday (time zone); fetch a range wide enough for any zone
  const anchor = m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 1000 : Math.floor(Date.now() / 1000) - 7 * DAY
  const from = anchor - 2 * DAY
  const to = anchor + (m ? 9 : 16) * DAY
  const [items, inSchool] = await Promise.all([myWeek(user.userId, from, to), isSchool(user.companyId)])
  const canManageEvents = user.role === 'manager' && inSchool
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <ScreenHead title={t.timetable.title} sub={t.timetable.sub} />
      <WeekCalendar
        items={items}
        week={m ? week : null}
        role={user.role}
        canManageEvents={canManageEvents}
        actions={canManageEvents ? <AddSchoolEventDialog defaultDate={week ?? today} /> : undefined}
      />
    </>
  )
}
