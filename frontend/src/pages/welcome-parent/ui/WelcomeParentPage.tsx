import Link from 'next/link'
import { redirect } from 'next/navigation'
import { needsParentStep, requestsOfChild } from '@/entities/family/server'
import { requireRole } from '@/entities/session/server'
import { AddParentForm, SkipParentStepButton } from '@/features/add-parent'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/** Student, right after signing up: "Add your parent" (or skip — home keeps a reminder). */
export async function WelcomeParentPage() {
  const user = await requireRole('student')
  const t = await getT()
  const [needed, sent] = await Promise.all([needsParentStep(user.userId), requestsOfChild(user.userId)])
  if (!needed && sent.length === 0) redirect('/home')
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-6">
      <Card>
        <CardHeader>
          <span className="mb-2 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon name="userAdd" className="size-5" />
          </span>
          <CardTitle className="text-xl">{t.family.stepTitle}</CardTitle>
          <CardDescription>{t.family.stepSub}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <AddParentForm />
          {sent.length > 0 ? (
            <Button variant="ghost" className="self-start" asChild>
              <Link href="/home">{t.family.continue}</Link>
            </Button>
          ) : (
            <SkipParentStepButton />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
