'use client'

import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { startConversationAction } from '../server/actions'

/** "Message" → opens the conversation with `withId` about `childId`. */
export function StartConversationButton({ childId, withId, label }: { childId: number; withId: number; label?: string }) {
  const t = useT()
  return (
    <form action={startConversationAction}>
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="withId" value={withId} />
      <SubmitButton variant="outline" size="sm" label={label ?? t.family.message} pendingLabel={label ?? t.family.message} />
    </form>
  )
}
