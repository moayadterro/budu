/** A teacher's course as Budu shows it (IOMAD course + its sections and activities). */

export type CourseSummary = {
  id: number
  title: string
  description: string
  published: boolean
  lessonCount: number
  /** unix seconds */
  updatedAt: number
  /** cover image file id (served by /files), null = generated cover */
  imageId: number | null
}

export type CourseFile = { id: number; name: string; size: number; mime: string }

/**
 * A lesson / item of a PUBLISHED course the teacher changed but hasn't published yet (students still
 * see the published version): new (hidden from students), changed (edit waiting), removed (still
 * visible to students until published). '' = as published. Only editors get these.
 */
export type DraftState = '' | 'new' | 'changed' | 'removed'

/** video / file = a lesson material (mod_resource); text = a rich-text page (mod_page); task = an assignment (mod_assign). */
export type LessonItemKind = 'video' | 'file' | 'text' | 'task'

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
  /** text pages only: HTML, already cleaned by IOMAD (HTMLPurifier) — safe to render */
  content: string
  draft: DraftState
}

export type CourseLesson = {
  /** IOMAD section id */
  id: number
  title: string
  description: string
  items: LessonItem[]
  draft: DraftState
}

/** `changes`: unpublished changes of a published course (editors; 0 for others). */
export type Course = CourseSummary & { canEdit: boolean; lessons: CourseLesson[]; changes: number; language: string | null; subject: string | null }

/** Browser URL of a lesson file (streamed by the /files route after an access check). */
export const fileUrl = (file: CourseFile) => `/files/${file.id}`

/** Limits shared by forms and server actions. */
export const COURSE_LIMITS = { title: 200, text: 5000, page: 200_000 } as const

/** A course the signed-in student is enrolled in. */
export type StudentCourse = {
  id: number
  title: string
  description: string
  teachers: string
  lessonCount: number
  homeworkCount: number
  /** homework not handed in yet */
  todo: number
}

export type EnrolResult = 'enrolled' | 'already' | 'notfound' | 'notstudent'
