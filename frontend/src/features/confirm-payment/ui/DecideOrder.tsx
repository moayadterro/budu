'use client'

import { ConfirmButton } from '@/shared/ui/confirm-button'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { decideOrderAction } from '../server/actions'

/** Confirm & enrol / Reject an order. */
export function DecideOrder({ orderId }: { orderId: number }) {
  const t = useT()
  const s = t.payments
  return (
    <div className="flex flex-wrap gap-2">
      <form action={decideOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="decision" value="reject" />
        <ConfirmButton label={s.reject} confirmLabel={s.confirmReject} />
      </form>
      <form action={decideOrderAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="decision" value="confirm" />
        <SubmitButton size="sm" label={s.confirm} pendingLabel={s.confirm} />
      </form>
    </div>
  )
}
