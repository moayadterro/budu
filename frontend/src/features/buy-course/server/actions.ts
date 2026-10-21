'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { rublesFor } from '@/entities/course'
import { catalog, enrolLearner, getListing } from '@/entities/course/server'
import { openOrder, placeOrder, reportPaid } from '@/entities/order/server'
import { requireRole } from '@/entities/session/server'
import { formId } from '@/shared/lib/form'
import { getRates } from '@/shared/server/fx'

/** The course, if it is listed in Explore and published (null otherwise). */
async function forSale(courseId: number, viewerId: number) {
  const listing = await getListing(courseId)
  if (!listing?.listed) return null
  const [course] = await catalog([courseId], viewerId)
  return course ? { course, listing } : null
}

/** Free course: the student joins at once — no school or approval needed. */
export async function enrolFreeAction(form: FormData) {
  const user = await requireRole('student')
  const courseId = formId(form, 'courseId')
  const sale = courseId ? await forSale(courseId, user.userId) : null
  if (!sale || sale.listing.price > 0) return
  if (!sale.course.enrolled) await enrolLearner(courseId, user.userId)
  revalidatePath('/', 'layout')
  redirect(`/classes/${courseId}`)
}

export type OrderView = { id: number; number: string; amountRub: number; status: 'pending' | 'reported' } | null

/** Paid course: the student's open order (created now at today's price if there's none). */
export async function startOrderAction(courseId: number): Promise<OrderView> {
  const user = await requireRole('student')
  if (!Number.isSafeInteger(courseId) || courseId <= 0) return null
  const existing = await openOrder(user.userId, courseId)
  if (existing) return view(existing)
  const sale = await forSale(courseId, user.userId)
  if (!sale || sale.listing.price <= 0 || sale.course.enrolled) return null
  const amountRub = rublesFor(sale.listing.price, sale.listing.currency, await getRates())
  if (amountRub === null) return null
  const order = await placeOrder({
    studentId: user.userId,
    courseId,
    courseTitle: sale.course.title,
    price: sale.listing.price,
    currency: sale.listing.currency,
    amountRub,
  })
  revalidatePath(`/explore/${courseId}`)
  return view(order)
}

/** The student says they've transferred the money; the admin checks and confirms. */
export async function reportPaidAction(orderId: number): Promise<OrderView> {
  const user = await requireRole('student')
  if (!Number.isSafeInteger(orderId)) return null
  const order = await reportPaid(user.userId, orderId)
  revalidatePath('/explore', 'layout')
  return order ? view(order) : null
}

const view = (o: { id: number; number: string; amountRub: number; status: string }): OrderView =>
  o.status === 'pending' || o.status === 'reported' ? { id: o.id, number: o.number, amountRub: o.amountRub, status: o.status } : null
