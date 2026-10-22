import { AcceptInviteForm } from '@/features/accept-invite'
import { AuthShell } from '@/widgets/auth-shell'
import { getT } from '@/shared/i18n/server'

/** Public: an invited person chooses their password (link from the invite email). */
export async function AcceptInvitePage(props: { searchParams: Promise<{ token?: string }> }) {
  const t = await getT()
  const { token } = await props.searchParams
  return (
    <AuthShell back={{ href: '/login', label: t.auth.backToSignIn }} title={t.auth.invite.title} sub={t.auth.invite.sub}>
      <AcceptInviteForm token={token ?? ''} />
    </AuthShell>
  )
}
