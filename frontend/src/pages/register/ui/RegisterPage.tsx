import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { ACCOUNT_KINDS, SignUpForm, type AccountKind } from '@/features/sign-up'
import { homeFor } from '@/shared/config/nav'
import { AuthShell } from '@/widgets/auth-shell'
import { getT } from '@/shared/i18n/server'

/** `?as=school` (or teacher / student) opens the form on that account type — e.g. from the pricing plans. */
export async function RegisterPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const t = await getT()
  const as = (await searchParams).as
  const kind = ACCOUNT_KINDS.includes(as as AccountKind) ? (as as AccountKind) : undefined
  const session = await getSession()
  if (session) redirect(homeFor(session.role))
  return (
    <AuthShell back={{ href: '/login', label: t.auth.backToSignIn }} wide title={t.signUp.title} sub={t.signUp.sub}>
      <SignUpForm initialKind={kind} />
    </AuthShell>
  )
}
