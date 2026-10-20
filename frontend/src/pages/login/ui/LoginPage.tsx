import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { SignInForm } from '@/features/sign-in'
import { homeFor } from '@/shared/config/nav'
import { safeNext } from '@/shared/lib/password'
import { AuthCard } from '@/shared/ui/auth-card'
import { getT } from '@/shared/i18n/server'

type Search = { next?: string; verified?: string; reset?: string }

export async function LoginPage(props: { searchParams: Promise<Search> }) {
  const t = await getT()
  const searchParams = await props.searchParams
  const session = await getSession()
  if (session) redirect(homeFor(session.role))
  const notice = searchParams.verified ? 'verified' : searchParams.reset ? 'reset' : undefined
  return (
    <AuthCard title={t.auth.signIn.title} sub={t.auth.signIn.sub}>
      <SignInForm next={safeNext(searchParams.next) ?? undefined} notice={notice} />
    </AuthCard>
  )
}
