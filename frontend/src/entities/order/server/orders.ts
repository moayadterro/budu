import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance } from '@/shared/server/iomad'
import { orderNumber, type Order, type OrderStatus } from '../model/types'

/**
 * Orders in app-db (`orders`). Plain functions with no Next.js dependency (could move to a billing
 * service later). Callers check roles; here only the data rules (one open order per student + course).
 * SERVER-SIDE ONLY.
 */

type Row = {
  id: string
  student_id: number
  course_id: number
  course_title: string
  price: string
  currency: string
  amount_rub: string
  status: OrderStatus
  created: number
  reported: number | null
  decided: number | null
}

const COLUMNS = `id, student_id, course_id, course_title, price, currency, amount_rub, status,
  extract(epoch FROM created_at)::int AS created, extract(epoch FROM reported_at)::int AS reported,
  extract(epoch FROM decided_at)::int AS decided`

const toOrder = (r: Row): Order => ({
  id: Number(r.id),
  number: orderNumber(Number(r.id)),
  studentId: r.student_id,
  courseId: r.course_id,
  courseTitle: r.course_title,
  price: Number(r.price),
  currency: r.currency,
  amountRub: Number(r.amount_rub),
  status: r.status,
  createdAt: r.created,
  reportedAt: r.reported,
  decidedAt: r.decided,
})

/** The student's open (pending / reported) order for a course, if any. */
export async function openOrder(studentId: number, courseId: number): Promise<Order | null> {
  const [row] = await query<Row>(
    `SELECT ${COLUMNS} FROM orders WHERE iomad_url = $1 AND student_id = $2 AND course_id = $3 AND status IN ('pending', 'reported')
      ORDER BY id DESC LIMIT 1`,
    [defaultInstance().url, studentId, courseId],
  )
  return row ? toOrder(row) : null
}

/** The open order for this student + course, or a new one at today's price. */
export async function placeOrder(o: { studentId: number; courseId: number; courseTitle: string; price: number; currency: string; amountRub: number }) {
  const existing = await openOrder(o.studentId, o.courseId)
  if (existing) return existing
  const [row] = await query<Row>(
    `INSERT INTO orders (iomad_url, student_id, course_id, course_title, price, currency, amount_rub)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (iomad_url, student_id, course_id) WHERE status IN ('pending', 'reported') DO NOTHING
     RETURNING ${COLUMNS}`,
    [defaultInstance().url, o.studentId, o.courseId, o.courseTitle, o.price, o.currency, o.amountRub],
  )
  return row ? toOrder(row) : (await openOrder(o.studentId, o.courseId))! // lost a race: the other request's order
}

/** The student pressed "I've paid". */
export async function reportPaid(studentId: number, orderId: number): Promise<Order | null> {
  const [row] = await query<Row>(
    `UPDATE orders SET status = 'reported', reported_at = now()
      WHERE id = $1 AND student_id = $2 AND status IN ('pending', 'reported') RETURNING ${COLUMNS}`,
    [orderId, studentId],
  )
  return row ? toOrder(row) : null
}

/** Orders waiting for the admin (reported first), and the latest decided ones. */
export async function ordersForAdmin(): Promise<{ open: Order[]; decided: Order[] }> {
  const rows = await query<Row>(
    `(SELECT ${COLUMNS} FROM orders WHERE iomad_url = $1 AND status IN ('pending', 'reported'))
     UNION ALL
     (SELECT ${COLUMNS} FROM orders WHERE iomad_url = $1 AND status IN ('confirmed', 'rejected') ORDER BY decided_at DESC LIMIT 20)`,
    [defaultInstance().url],
  )
  const orders = rows.map(toOrder)
  return {
    open: orders
      .filter((o) => o.status === 'pending' || o.status === 'reported')
      .sort((a, b) => Number(b.status === 'reported') - Number(a.status === 'reported') || b.createdAt - a.createdAt),
    decided: orders.filter((o) => o.status === 'confirmed' || o.status === 'rejected').sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0)),
  }
}

/** The admin confirms or rejects an open order. Returns it, or null if it wasn't open. */
export async function decideOrder(orderId: number, adminId: number, confirm: boolean): Promise<Order | null> {
  const [row] = await query<Row>(
    `UPDATE orders SET status = $3, decided_at = now(), decided_by = $2
      WHERE id = $1 AND status IN ('pending', 'reported') RETURNING ${COLUMNS}`,
    [orderId, adminId, confirm ? 'confirmed' : 'rejected'],
  )
  return row ? toOrder(row) : null
}
