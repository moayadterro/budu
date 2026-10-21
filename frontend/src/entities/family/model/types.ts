import type { Person } from '@/shared/lib/person'

/** A parent or child, with the schools (IOMAD companies) they belong to. */
export type FamilyMember = Person & { schools: Array<{ companyId: number; name: string }> }

export type Family = { parents: FamilyMember[]; children: FamilyMember[] }

/** A student asked someone to be their parent; the parent accepts or declines. */
export type ParentRequest = {
  id: number
  childId: number
  childName: string
  parentId: number
  parentName: string
  parentEmail: string
  /** unix seconds */
  createdAt: number
}

/** A child's course with the teachers a parent may message. */
export type ChildCourse = { courseId: number; courseTitle: string; teachers: Person[] }

/** Period of a progress summary: last 24 hours, last 7 days, last 30 days. */
export type Period = 'day' | 'week' | 'month'
export const PERIODS: Period[] = ['day', 'week', 'month']
