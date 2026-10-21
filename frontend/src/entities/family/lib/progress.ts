import type { Period } from '../model/types'

const SPAN: Record<Period, number> = { day: 86400, week: 7 * 86400, month: 30 * 86400 }

/** The homework fields a progress summary needs (StudentHomework fits). */
type Hw = {
  id: number
  title: string
  courseId: number
  courseTitle: string
  status: 'new' | 'submitted' | 'graded'
  grade: number | null
  feedback: string
  dueAt: number | null
  submittedAt: number | null
  gradedAt: number | null
}

export type CourseProgress = { courseId: number; courseTitle: string; average: number | null; done: number; total: number }

export type Progress<H extends Hw> = {
  /** handed in during the period (late = after its due date) */
  handedIn: H[]
  late: H[]
  /** due date passed and still not handed in (any time — a parent should see all of it) */
  overdue: H[]
  /** graded during the period, newest first — the teachers' feedback */
  graded: H[]
  /** average of the grades given during the period (0–100), null if none */
  periodAverage: number | null
  /** per course, all time */
  courses: CourseProgress[]
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null)

/** How a student is doing over a period, from their homework list. Pure: `now` in unix seconds. */
export function progress<H extends Hw>(homework: H[], period: Period, now: number): Progress<H> {
  const from = now - SPAN[period]
  const inPeriod = (t: number | null) => t !== null && t >= from && t <= now
  const handedIn = homework.filter((h) => h.status !== 'new' && inPeriod(h.submittedAt))
  const late = handedIn.filter((h) => h.dueAt !== null && h.submittedAt! > h.dueAt)
  const overdue = homework.filter((h) => h.status === 'new' && h.dueAt !== null && h.dueAt < now).sort((a, b) => a.dueAt! - b.dueAt!)
  const graded = homework.filter((h) => h.status === 'graded' && inPeriod(h.gradedAt)).sort((a, b) => b.gradedAt! - a.gradedAt!)

  const byCourse = new Map<number, H[]>()
  for (const h of homework) byCourse.set(h.courseId, [...(byCourse.get(h.courseId) ?? []), h])
  const courses = [...byCourse.values()].map((hs) => ({
    courseId: hs[0].courseId,
    courseTitle: hs[0].courseTitle,
    average: avg(hs.filter((h) => h.grade !== null).map((h) => h.grade!)),
    done: hs.filter((h) => h.status !== 'new').length,
    total: hs.length,
  }))

  return { handedIn, late, overdue, graded, periodAverage: avg(graded.map((h) => h.grade!)), courses }
}
