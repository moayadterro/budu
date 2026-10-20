import { ForgotPasswordForm } from '@/features/reset-password'
import { AuthCard } from '@/shared/ui/auth-card'
import { getT } from '@/shared/i18n/server'

export async function ForgotPasswordPage() {
  const t = await getT()
  return (
    <AuthCard title={t.auth.forgot.title} sub={t.auth.forgot.sub}>
      <ForgotPasswordForm />
    </AuthCard>
  )
}
