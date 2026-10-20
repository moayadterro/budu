import { ResetPasswordForm } from '@/features/reset-password'
import { AuthCard } from '@/shared/ui/auth-card'
import { t } from '@/shared/i18n'

export async function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams
  return (
    <AuthCard title={t.auth.reset.title} sub={t.auth.reset.sub}>
      <ResetPasswordForm token={searchParams.token ?? ''} />
    </AuthCard>
  )
}
