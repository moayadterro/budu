'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon } from '@hugeicons/core-free-icons'
import { DropdownMenuItem } from '@/shared/ui/dropdown-menu'
import { useT } from '@/shared/i18n'
import { signOut } from '../server/actions'

/** "Sign out" entry for a dropdown menu (user menu in the sidebar). */
export function SignOutMenuItem() {
  const t = useT()
  return (
    <DropdownMenuItem
      onSelect={() => {
        void signOut()
      }}
    >
      <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
      {t.auth.signOut}
    </DropdownMenuItem>
  )
}
