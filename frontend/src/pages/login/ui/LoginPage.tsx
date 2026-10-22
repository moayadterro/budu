import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { SignInForm } from '@/features/sign-in'
import { homeFor } from '@/shared/config/nav'
import { safeNext } from '@/shared/lib/password'
import { AuthShell } from '@/widgets/auth-shell'
import { getT } from '@/shared/i18n/server'

type Search = { next?: string; verified?: string; reset?: string; invited?: string }

export async function LoginPage(props: { searchParams: Promise<Search> }) {
  const t = await getT()
  const searchParams = await props.searchParams
  const session = await getSession()
  if (session) redirect(homeFor(session.role))
  const notice = searchParams.verified ? 'verified' : searchParams.reset ? 'reset' : searchParams.invited ? 'invited' : undefined
  return (
    <AuthShell back={{ href: '/', label: t.auth.backToSite }} title={t.auth.signIn.title} sub={t.auth.signIn.sub}>
      <SignInForm next={safeNext(searchParams.next) ?? undefined} notice={notice} />
    </AuthShell>
  )
}
