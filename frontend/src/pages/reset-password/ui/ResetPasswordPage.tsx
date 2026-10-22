import { ResetPasswordForm } from '@/features/reset-password'
import { AuthShell } from '@/widgets/auth-shell'
import { getT } from '@/shared/i18n/server'

export async function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const t = await getT()
  const searchParams = await props.searchParams
  return (
    <AuthShell back={{ href: '/login', label: t.auth.backToSignIn }} title={t.auth.reset.title} sub={t.auth.reset.sub}>
      <ResetPasswordForm token={searchParams.token ?? ''} />
    </AuthShell>
  )
}
