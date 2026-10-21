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

export function CancelParentRequestButton({ requestId, email }: { requestId: number; email: string }) {
  const t = useT()
  return (
    <form action={cancelParentRequestAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <ConfirmButton
        icon="cancel"
        label={t.family.cancel}
        confirmLabel={t.confirm.parentRequestTitle(email)}
        description={t.confirm.parentRequestDesc}
        keepLabel={t.confirm.keepRequest}
      />
    </form>
  )
}

export function RemoveParentButton({ parentId, name }: { parentId: number; name: string }) {
  const t = useT()
  return (
    <form action={removeParentAction}>
      <input type="hidden" name="parentId" value={parentId} />
      <ConfirmButton icon="userRemove" label={t.family.remove} confirmLabel={t.confirm.parentTitle(name)} description={t.confirm.parentDesc} />
    </form>
  )
}
