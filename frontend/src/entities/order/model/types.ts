/** A course purchase, paid by bank transfer and confirmed by the platform admin. */
export type OrderStatus = 'pending' | 'reported' | 'confirmed' | 'rejected'

export type Order = {
  id: number
  /** what the student writes in the transfer comment, e.g. "BU-000042" */
  number: string
  studentId: number
  courseId: number
  courseTitle: string
  price: number
  currency: string
  /** amount to transfer, in rubles */
  amountRub: number
  status: OrderStatus
  /** unix seconds */
  createdAt: number
  reportedAt: number | null
  decidedAt: number | null
}

export const orderNumber = (id: number) => `BU-${String(id).padStart(6, '0')}`
