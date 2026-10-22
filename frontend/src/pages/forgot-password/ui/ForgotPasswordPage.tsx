import { ForgotPasswordForm } from '@/features/reset-password'
import { AuthShell } from '@/widgets/auth-shell'
import { getT } from '@/shared/i18n/server'

export async function ForgotPasswordPage() {
  const t = await getT()
  return (
    <AuthShell back={{ href: '/login', label: t.auth.backToSignIn }} title={t.auth.forgot.title} sub={t.auth.forgot.sub}>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
