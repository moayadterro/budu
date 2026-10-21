'use client'

import type { SchoolInvite } from '@/entities/tenant/server'
import { Card, CardContent } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { answerInviteAction } from '../server/actions'

/** One invitation with Accept / Decline. */
export function InviteCard({ invite }: { invite: Pick<SchoolInvite, 'id' | 'school' | 'role' | 'invitedBy'> }) {
  const t = useT()
  const s = t.invites
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="grid size-10 flex-none place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name="users" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{invite.school}</div>
          <p className="text-sm text-muted-foreground">{s.from({ school: invite.school, role: t.role[invite.role], by: invite.invitedBy })}</p>
        </div>
        <div className="flex gap-2">
          <form action={answerInviteAction}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <input type="hidden" name="answer" value="decline" />
            <SubmitButton variant="outline" label={s.decline} pendingLabel={s.decline} />
          </form>
          <form action={answerInviteAction}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <input type="hidden" name="answer" value="accept" />
            <SubmitButton label={s.accept} pendingLabel={s.accept} />
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
