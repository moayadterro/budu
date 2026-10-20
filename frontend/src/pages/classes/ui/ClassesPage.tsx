import { SubjectCard } from '@/entities/subject'
import { SUBJECT_KEYS } from '@/shared/mock'
import { ScreenHead } from '@/shared/ui/screen-head'
import { t } from '@/shared/i18n'

export function ClassesPage() {
  return (
    <>
      <ScreenHead title={t.classes.title} sub={t.classes.sub} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        {SUBJECT_KEYS.map((s) => (
          <SubjectCard key={s} subject={s} />
        ))}
      </div>
    </>
  )
}
