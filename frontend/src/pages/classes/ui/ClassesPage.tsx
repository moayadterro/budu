import { SubjectCard } from '@/entities/subject'
import { SUBJECT_KEYS } from '@/shared/mock'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

export async function ClassesPage() {
  const t = await getT()
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
