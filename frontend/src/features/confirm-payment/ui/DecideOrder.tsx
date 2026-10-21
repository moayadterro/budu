'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { decideOrderAction } from '../server/actions'

/** Confirm & enrol / Reject an order. */
export function DecideOrder({ orderId, number }: { orderId: number; number: string }) {
  const t = useT()
  const s = t.payments
  return (
    <div className="flex flex-wrap gap-2">
      <form action={decideOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="decision" value="reject" />
        <ConfirmButton icon="cancel" label={s.reject} confirmLabel={t.confirm.rejectOrderTitle(number)} description={t.confirm.rejectOrderDesc} />
      </form>
      <form action={decideOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="decision" value="confirm" />
        <SubmitButton size="sm" label={s.confirm} pendingLabel={s.confirm} />
      </form>
    </div>
  )
}
