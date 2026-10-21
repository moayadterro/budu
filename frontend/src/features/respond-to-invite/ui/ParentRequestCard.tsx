'use client'

import type { ParentRequest } from '@/entities/family'
import { Card, CardContent } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { answerParentRequestAction } from '../server/actions'

/** A child's request to be their parent, with Accept / Decline. */
export function ParentRequestCard({ request }: { request: Pick<ParentRequest, 'id' | 'childName'> }) {
  const t = useT()
  const s = t.family
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="grid size-10 flex-none place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name="userAdd" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{request.childName}</div>
          <p className="text-sm text-muted-foreground">{s.requestFrom(request.childName)}</p>
        </div>
        <div className="flex gap-2">
          {(['decline', 'accept'] as const).map((answer) => (
            <form key={answer} action={answerParentRequestAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <input type="hidden" name="answer" value={answer} />
              <SubmitButton variant={answer === 'accept' ? 'default' : 'outline'} label={s[answer]} pendingLabel={s[answer]} />
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
