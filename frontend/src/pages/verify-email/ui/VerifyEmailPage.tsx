import Link from 'next/link'
import { verifyEmail } from '@/features/verify-email/server'
import { AuthCard } from '@/shared/ui/auth-card'
import { buttonVariants } from '@/shared/ui/button'
import { t } from '@/shared/i18n'

export async function VerifyEmailPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams
  const ok = await verifyEmail(searchParams.token)
  const s = t.auth.verify
  return (
    <AuthCard title={ok ? s.okTitle : s.failTitle} sub={ok ? s.okBody : s.failBody}>
      <Link href={ok ? '/login?verified=1' : '/login'} className={buttonVariants({ className: 'w-full' })}>
        {s.toSignIn}
      </Link>
    </AuthCard>
  )
}
