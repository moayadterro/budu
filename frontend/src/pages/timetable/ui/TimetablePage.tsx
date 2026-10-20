import { TimetableDay, TimetableWeek } from '@/widgets/timetable'
import { ScreenHead } from '@/shared/ui/screen-head'
import { t } from '@/shared/i18n'

/** Timetable: week grid on desktop, iOS-style day view on mobile. */
export function TimetablePage() {
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
