import { QuizSettingsForm } from '@/features/edit-quiz'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { getT } from '@/shared/i18n/server'
import { BackLink, managerSpace } from './shared'

/** Manager: a new school exam — settings, then questions and who takes it. */
export async function SchoolExamNewPage() {
  const { spaceId } = await managerSpace()
  const t = await getT()
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <BackLink href="/school/exams" label={t.exams.title} />
      <Card>
        <CardHeader>
          <CardTitle>{t.exams.new}</CardTitle>
          <CardDescription>{t.exams.newSub}</CardDescription>
        </CardHeader>
        <CardContent>
          <QuizSettingsForm courseId={spaceId} classes={[]} base="/school/exams" examOnly />
        </CardContent>
      </Card>
    </div>
  )
}
