import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { SignUpForm } from '@/features/sign-up'
import { homeFor } from '@/shared/config/nav'
import { AuthCard } from '@/shared/ui/auth-card'
import { t } from '@/shared/i18n'

export async function RegisterPage() {
  const session = await getSession()
  if (session) redirect(homeFor(session.role))
  return (
    <AuthCard wide title={t.signUp.title} sub={t.signUp.sub}>
      <SignUpForm />
    </AuthCard>
  )
}
