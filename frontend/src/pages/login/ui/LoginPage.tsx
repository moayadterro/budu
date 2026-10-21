import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { SignInForm } from '@/features/sign-in'
import { homeFor } from '@/shared/config/nav'
import { safeNext } from '@/shared/lib/password'
import { AuthCard } from '@/shared/ui/auth-card'
import { getT } from '@/shared/i18n/server'

type Search = { next?: string; verified?: string; reset?: string; invited?: string }

export async function LoginPage(props: { searchParams: Promise<Search> }) {
  const t = await getT()
  const searchParams = await props.searchParams
  const session = await getSession()
  if (session) redirect(homeFor(session.role))
  const notice = searchParams.verified ? 'verified' : searchParams.reset ? 'reset' : searchParams.invited ? 'invited' : undefined
  return (
    <AuthCard title={t.auth.signIn.title} sub={t.auth.signIn.sub}>
      <SignInForm next={safeNext(searchParams.next) ?? undefined} notice={notice} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/catalog" className="font-medium text-primary underline-offset-4 hover:underline">
          {t.catalog.browse}
        </Link>
      </p>
    </AuthCard>
  )
}
