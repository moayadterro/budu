import { ordersForAdmin } from '@/entities/order/server'
import { requireRole } from '@/entities/session/server'
import { getUserById } from '@/entities/user/server'
import { DecideOrder } from '@/features/confirm-payment'
import { PAYMENT } from '@/shared/config/payment'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getLocale, getT } from '@/shared/i18n/server'

/** Platform admin: course purchases to confirm (the student reported the transfer) and recent decisions. */
export async function AdminPaymentsPage() {
  await requireRole('admin')
  const t = await getT()
  const s = t.payments
  const locale = await getLocale()
  const { open, decided } = await ordersForAdmin()
  const people = new Map(
    (await Promise.all([...new Set([...open, ...decided].map((o) => o.studentId))].map(getUserById))).filter((u) => u !== null).map((u) => [u.id, u]),
  )
  const money = (o: (typeof open)[number]) =>
    o.currency === 'RUB'
      ? formatMoney(o.amountRub, 'RUB', locale)
      : `${formatMoney(o.amountRub, 'RUB', locale)} (${formatMoney(o.price, o.currency, locale)})`

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <ScreenHead title={s.title} sub={s.sub(PAYMENT.receiptEmail)} />
      <Card>
        <CardHeader>
          <CardTitle>{s.openTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {open.length === 0 && <p className="text-sm text-muted-foreground">{s.empty}</p>}
          {open.map((o) => {
            const student = people.get(o.studentId)
            return (
              <Item key={o.id} variant="outline" size="sm" className="flex-wrap">
                <ItemContent className="min-w-0">
                  <ItemTitle className="flex flex-wrap items-center gap-2">
                    <code dir="ltr" className="font-mono">{o.number}</code>
                    <span className="tabular-nums">{money(o)}</span>
                    <Badge variant={o.status === 'reported' ? 'warning' : 'secondary'}>{o.status === 'reported' ? s.reported : s.waiting}</Badge>
                  </ItemTitle>
                  <ItemDescription>
                    {o.courseTitle} · {student ? `${student.name} <${student.email}>` : `#${o.studentId}`} · <LocalTime seconds={o.reportedAt ?? o.createdAt} />
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DecideOrder orderId={o.id} number={o.number} />
                </ItemActions>
              </Item>
            )
          })}
        </CardContent>
      </Card>
      {decided.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{s.history}</CardTitle>
            <CardDescription>{s.historySub}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {decided.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b py-2 text-sm last:border-0">
                <code dir="ltr" className="font-mono">{o.number}</code>
                <span className="tabular-nums">{money(o)}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {o.courseTitle} · {people.get(o.studentId)?.name ?? `#${o.studentId}`}
                </span>
                <Badge variant={o.status === 'confirmed' ? 'success' : 'destructive'}>{o.status === 'confirmed' ? s.confirmed : s.rejected}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
