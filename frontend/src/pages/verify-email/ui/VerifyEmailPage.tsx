import Link from 'next/link'
import { verifyEmail } from '@/features/verify-email/server'
import { AuthShell } from '@/widgets/auth-shell'
import { buttonVariants } from '@/shared/ui/button'
import { getT } from '@/shared/i18n/server'

export async function VerifyEmailPage(props: { searchParams: Promise<{ token?: string }> }) {
  const t = await getT()
  const searchParams = await props.searchParams
  const ok = await verifyEmail(searchParams.token)
  const s = t.auth.verify
  return (
    <AuthShell back={{ href: '/login', label: t.auth.backToSignIn }} title={ok ? s.okTitle : s.failTitle} sub={ok ? s.okBody : s.failBody}>
      <Link href={ok ? '/login?verified=1' : '/login'} className={buttonVariants({ className: 'w-full' })}>
        {s.toSignIn}
      </Link>
    </AuthShell>
  )
}
