import { TimetableDay, TimetableWeek } from '@/widgets/timetable'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Timetable: week grid on desktop, iOS-style day view on mobile. */
export async function TimetablePage() {
  const t = await getT()
  return (
    <>
      <ScreenHead title={t.timetable.title} sub={t.timetable.sub} />
      <div className="md:hidden">
        <TimetableDay />
      </div>
      <TimetableWeek className="hidden md:block" />
    </>
  )
}
