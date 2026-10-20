import { SubmitButton } from '@/shared/ui/submit-button'
import { t } from '@/shared/i18n'
import { signOut } from '../server/actions'

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton variant="outline" label={t.auth.signOut} pendingLabel={t.auth.signOut} />
    </form>
  )
}
