/** A teacher's course as Budu shows it (IOMAD course + its sections and activities). */

export type CourseSummary = {
  id: number
  title: string
  description: string
  published: boolean
  lessonCount: number
  /** unix seconds */
  updatedAt: number
}

export type CourseFile = { id: number; name: string; size: number; mime: string }

/** video / file = a lesson material (mod_resource); task = an assignment (mod_assign). */
export type LessonItemKind = 'video' | 'file' | 'task'

export type LessonItem = {
  /** IOMAD course-module id */
  id: number
  kind: LessonItemKind
  name: string
  /** tasks only (plain text) */
  instructions: string
  /** tasks only: unix seconds, or null */
  dueAt: number | null
  files: CourseFile[]
}

export type CourseLesson = {
  /** IOMAD section id */
  id: number
  title: string
  description: string
  items: LessonItem[]
}

export type Course = CourseSummary & { canEdit: boolean; lessons: CourseLesson[] }

/** Browser URL of a lesson file (streamed by the /files route after an access check). */
export const fileUrl = (file: CourseFile) => `/files/${file.id}`

/** Limits shared by forms and server actions. */
export const COURSE_LIMITS = { title: 200, text: 5000 } as const
