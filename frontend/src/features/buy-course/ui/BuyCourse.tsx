'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { PAYMENT } from '@/shared/config/payment'
import { formatMoney } from '@/shared/lib/money'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Icon } from '@/shared/ui/icon'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useLocale, useT } from '@/shared/i18n'
import { enrolFreeAction, reportPaidAction, startOrderAction, type OrderView } from '../server/actions'

/**
 * The action on a marketplace course: Open (enrolled), Enrol for free, or Buy → payment instructions
 * (bank transfer in rubles with the order number) → "I've paid" → the admin confirms and enrols.
 */
export function BuyCourse({
  courseId,
  courseTitle,
  free,
  enrolled,
  order: initialOrder,
}: {
  courseId: number
  courseTitle: string
  free: boolean
  enrolled: boolean
  /** the student's open order, if any */
  order: OrderView
}) {
  const t = useT()
  const s = t.shop
  const [order, setOrder] = useState(initialOrder)
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()

  if (enrolled)
    return (
      <Button className="w-full" asChild>
        <Link href={`/classes/${courseId}`}>{s.open}</Link>
      </Button>
    )

  if (free)
    return (
      <form action={enrolFreeAction}>
        <input type="hidden" name="courseId" value={courseId} />
        <SubmitButton className="w-full" label={s.enrolFree} pendingLabel={s.enrolFree} />
      </form>
    )

  const buy = () => {
    setOpen(true)
    if (order) return
    start(async () => {
      const o = await startOrderAction(courseId)
      setFailed(!o)
      setOrder(o)
    })
  }

  return (
    <>
      {order?.status === 'reported' && (
        <Alert variant="info" className="mb-3">
          <AlertDescription>{s.checking}</AlertDescription>
        </Alert>
      )}
      <Button className="w-full" onClick={buy} variant={order?.status === 'reported' ? 'outline' : 'default'}>
        <Icon name="cart" />
        {order?.status === 'reported' ? s.payDetails : s.buy}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{s.pay.title}</DialogTitle>
            <DialogDescription>{courseTitle}</DialogDescription>
          </DialogHeader>
          {failed && <Alert variant="destructive">{s.pay.failed}</Alert>}
          {!order && !failed && <p className="py-6 text-center text-sm text-muted-foreground">{pending ? s.pay.preparing : ''}</p>}
          {order && <PaymentSteps order={order} onReported={setOrder} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function PaymentSteps({ order, onReported }: { order: NonNullable<OrderView>; onReported: (o: OrderView) => void }) {
  const t = useT()
  const locale = useLocale()
  const s = t.shop.pay
  const [pending, start] = useTransition()
  const amount = formatMoney(order.amountRub, PAYMENT.currency, locale)
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/40 p-4 text-center">
        <div className="text-xs text-muted-foreground">{s.amount}</div>
        <div className="text-3xl font-semibold tabular-nums">{amount}</div>
      </div>
      <ol className="flex list-decimal flex-col gap-3 ps-5 text-sm">
        <li>
          {s.step1(amount)}
          <CopyRow value={PAYMENT.phone} />
        </li>
        <li>
          {s.step2}
          <CopyRow value={order.number} />
        </li>
        <li>
          {s.step3}{' '}
          <a
            href={`mailto:${PAYMENT.receiptEmail}?subject=${encodeURIComponent(order.number)}`}
            className="font-medium text-primary underline underline-offset-4"
          >
            {PAYMENT.receiptEmail}
          </a>
        </li>
      </ol>
      <p className="text-xs text-muted-foreground">{s.note}</p>
      {order.status === 'reported' ? (
        <Alert variant="success">{s.reported}</Alert>
      ) : (
        <Button disabled={pending} onClick={() => start(async () => onReported((await reportPaidAction(order.id)) ?? order))}>
          {s.paid}
        </Button>
      )}
    </div>
  )
}

/** A value with a Copy button (phone number, order number). */
function CopyRow({ value }: { value: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  return (
    <span className="mt-1 flex items-center gap-2">
      <code dir="ltr" className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
        {value}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          } catch {
            /* clipboard blocked: the value is visible to copy by hand */
          }
        }}
      >
        <Icon name={copied ? 'tick' : 'copy'} />
        {copied ? t.shop.pay.copied : t.shop.pay.copy}
      </Button>
    </span>
  )
}
