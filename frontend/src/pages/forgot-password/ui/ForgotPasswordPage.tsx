import { ForgotPasswordForm } from '@/features/reset-password'
import { AuthCard } from '@/shared/ui/auth-card'
import { t } from '@/shared/i18n'

export function ForgotPasswordPage() {
  return (
    <AuthCard title={t.auth.forgot.title} sub={t.auth.forgot.sub}>
      <ForgotPasswordForm />
    </AuthCard>
  )
}
