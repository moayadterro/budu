'use client'

import { Button } from '@/shared/ui/button'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { useFormStatus } from 'react-dom'
import { useT } from '@/shared/i18n'
import { cancelParentRequestAction, removeParentAction, skipParentStepAction } from '../server/actions'

function SkipSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" disabled={pending}>
      {label}
    </Button>
  )
}

/** "Skip for now" on the step after sign-up (its own form: place it outside AddParentForm). */
export function SkipParentStepButton() {
  const t = useT()
  return (
    <form action={skipParentStepAction}>
      <SkipSubmit label={t.family.skip} />
    </form>
  )
}

export function CancelParentRequestButton({ requestId }: { requestId: number }) {
  const t = useT()
  return (
    <form action={cancelParentRequestAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <ConfirmButton label={t.family.cancel} confirmLabel={t.family.confirmRemove} />
    </form>
  )
}

export function RemoveParentButton({ parentId }: { parentId: number }) {
  const t = useT()
  return (
    <form action={removeParentAction}>
      <input type="hidden" name="parentId" value={parentId} />
      <ConfirmButton label={t.family.remove} confirmLabel={t.family.confirmRemove} />
    </form>
  )
}
