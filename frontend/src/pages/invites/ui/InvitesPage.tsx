import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { invitesFor } from '@/entities/tenant/server'
import { InviteCard } from '@/features/respond-to-invite'
import { Empty, EmptyDescription, EmptyHeader } from '@/shared/ui/empty'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

/** Any signed-in user: school invitations waiting for their answer. */
export async function InvitesPage() {
  const user = await getSession()
  if (!user) redirect('/login')
  const t = await getT()
  const invites = await invitesFor(user.userId)
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <ScreenHead title={t.invites.title} sub={t.invites.sub} />
      {invites.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyDescription>{t.invites.empty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        invites.map((i) => <InviteCard key={i.id} invite={i} />)
      )}
    </div>
  )
}
