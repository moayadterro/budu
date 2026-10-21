import type { Person } from '@/shared/lib/person'

/** A school class (e.g. "Class 10"): a group of students, enrolled into courses together. */
export type SchoolClass = {
  id: number
  name: string
  description: string
  studentCount: number
  courseCount: number
  courseIds: number[]
  /** class teachers (optional; they manage the class) */
  teachers: Person[]
  /** the signed-in user is one of its class teachers */
  mine: boolean
}

export type ClassDetail = SchoolClass & {
  companyId: number
  /** the signed-in user may change it (school manager) */
  canManage: boolean
  students: Person[]
  courses: Array<{ id: number; title: string; published: boolean; teachers: string }>
}
