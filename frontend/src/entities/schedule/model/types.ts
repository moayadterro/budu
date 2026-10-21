/** Something on the timetable: a lesson of a course, or a school event. Times are unix seconds. */
export type CalendarItem = {
  id: number
  kind: 'lesson' | 'event'
  title: string
  description: string
  start: number
  /** seconds; 0 = no end time */
  duration: number
  courseId: number | null
  courseTitle: string
  /** the class a lesson is for ('' = everyone in the course) */
  className: string
  teachers: string
  /** school events: the school's name */
  school: string
  seriesId: number | null
}

/** A weekly lesson series of a course (Schedule tab). */
export type LessonSeries = {
  id: number
  first: number
  last: number
  count: number
  duration: number
  description: string
  className: string
}

/**
 * A calm, stable colour per course (same course → same colour everywhere), from the theme's tokens.
 * School events use the highlight (amber) token.
 */
const PALETTE = [
  'var(--chart-3)',
  'var(--info)',
  'var(--subject-purple)',
  'var(--warning)',
  'var(--subject-terra)',
  'var(--chart-5)',
  'var(--destructive)',
]
export const courseColor = (courseId: number | null) => (courseId ? PALETTE[courseId % PALETTE.length] : 'var(--highlight)')

/** Lessons of 6 h+ or without an end, and all such events, go to the all-day lane. */
export const isAllDay = (i: CalendarItem) => i.duration === 0 || i.duration >= 6 * 3600
