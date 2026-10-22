import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { SignUpForm } from '@/features/sign-up'
import { homeFor } from '@/shared/config/nav'
import { AuthShell } from '@/widgets/auth-shell'
import { getT } from '@/shared/i18n/server'

export async function RegisterPage() {
  const t = await getT()
  const session = await getSession()
  if (session) redirect(homeFor(session.role))
  return (
    <AuthShell back={{ href: '/login', label: t.auth.backToSignIn }} wide title={t.signUp.title} sub={t.signUp.sub}>
      <SignUpForm />
    </AuthShell>
  )
}
