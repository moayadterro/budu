'use server'

import { revalidatePath } from 'next/cache'
import { enrolLearner } from '@/entities/course/server'
import { notify } from '@/entities/notification/server'
import { decideOrder } from '@/entities/order/server'
import { requireRole } from '@/entities/session/server'
import { getUserById } from '@/entities/user/server'
import { formId } from '@/shared/lib/form'
import { audit } from '@/shared/server/audit'

/**
 * Platform admin, after checking the transfer and the receipt: confirm (→ the student is enrolled and
 * told) or reject (→ the student is told to write to billing).
 */
export async function decideOrderAction(form: FormData) {
  const admin = await requireRole('admin')
  const orderId = formId(form, 'orderId')
  const confirm = form.get('decision') === 'confirm'
  if (!orderId) return
  const order = await decideOrder(orderId, admin.userId, confirm)
  if (!order) return
  audit(confirm ? 'paymentConfirmed' : 'paymentRejected', { target: `order ${order.number}`, details: { course: order.courseTitle, student: order.studentId } })
  if (confirm) await enrolLearner(order.courseId, order.studentId)
  const student = await getUserById(order.studentId)
  if (student) {
    await notify(
      [student],
      confirm ? 'orderConfirmed' : 'orderRejected',
      { course: order.courseTitle, order: order.number },
      confirm ? `/classes/${order.courseId}` : `/explore/${order.courseId}`,
    )
  }
  revalidatePath('/admin/payments')
}
