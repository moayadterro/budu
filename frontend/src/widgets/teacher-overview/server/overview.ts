import 'server-only'
import { listTeacherCourses } from '@/entities/course/server'
import { getGradebook } from '@/entities/homework/server'
import type { CourseSummary } from '@/entities/course'

export type CourseOverview = CourseSummary & {
  students: number
  homework: number
  /** answers handed in, not graded yet */
  toGrade: number
  /** homework with a due date in the next 7 days */
  dueThisWeek: number
}

/** The teacher's courses with student / homework / to-grade counts (one gradebook read per course). */
export async function teacherOverview(userId: number, companyId: number | null): Promise<CourseOverview[]> {
  if (!companyId) return []
  const courses = await listTeacherCourses(userId, companyId)
  const now = Date.now() / 1000
  const week = now + 7 * 24 * 3600
  return Promise.all(
    courses.map(async (c) => {
      const gb = await getGradebook(userId, c.id)
      return {
        ...c,
        students: gb?.rows.length ?? 0,
        homework: gb?.homework.length ?? 0,
        toGrade: gb?.rows.reduce((n, r) => n + r.cells.filter((x) => x.status === 'submitted').length, 0) ?? 0,
        dueThisWeek: gb?.homework.filter((h) => h.dueAt && h.dueAt >= now && h.dueAt <= week).length ?? 0,
      }
    }),
  )
}
