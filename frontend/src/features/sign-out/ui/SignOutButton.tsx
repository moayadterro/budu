'use client'

import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { signOut } from '../server/actions'

export function SignOutButton() {
  const t = useT()
  return (
    <form action={signOut}>
      <SubmitButton variant="outline" label={t.auth.signOut} pendingLabel={t.auth.signOut} />
    </form>
  )
}
