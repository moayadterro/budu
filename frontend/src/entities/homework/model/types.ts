import type { Person } from '@/shared/lib/person'

/** Homework = a lesson task (IOMAD assignment), graded 0–100. */
export type HomeworkStatus = 'new' | 'submitted' | 'graded'

export type HomeworkFile = { id: number; name: string; size: number; mime: string }

type State = {
  status: HomeworkStatus
  /** 0–100, or null when not graded */
  grade: number | null
  feedback: string
  /** unix seconds, or null */
  submittedAt: number | null
  /** unix seconds, or null */
  gradedAt: number | null
}

/** One homework in the student's list. */
export type StudentHomework = State & {
  id: number
  title: string
  dueAt: number | null
  courseId: number
  courseTitle: string
  lessonId: number
  lessonTitle: string
}

/** A homework as the student sees it, with their answer. */
export type HomeworkDetail = State & {
  id: number
  title: string
  instructions: string
  dueAt: number | null
  courseId: number
  courseTitle: string
  attachments: HomeworkFile[]
  answer: string
  files: HomeworkFile[]
}

/** A handed-in answer in the teacher's grading queue. */
export type SubmissionRow = State & {
  homeworkId: number
  homeworkTitle: string
  dueAt: number | null
  courseId: number
  courseTitle: string
  student: Person
}

/** One answer opened for grading. */
export type SubmissionDetail = State & {
  homeworkId: number
  homeworkTitle: string
  dueAt: number | null
  courseId: number
  courseTitle: string
  student: Person
  answer: string
  files: HomeworkFile[]
}

export type Gradebook = {
  courseId: number
  courseTitle: string
  homework: Array<{ id: number; title: string; dueAt: number | null }>
  rows: Array<{ student: Person; cells: Array<{ homeworkId: number; status: HomeworkStatus; grade: number | null }> }>
}

/** Late = handed in after the due date (or not handed in and the due date has passed). */
export const isLate = (h: { dueAt: number | null; submittedAt: number | null }, now = Date.now() / 1000) =>
  !!h.dueAt && (h.submittedAt ? h.submittedAt > h.dueAt : now > h.dueAt)

/** Browser URL of a homework file (attachment or answer), served by the /files route. */
export const homeworkFileUrl = (f: HomeworkFile) => `/files/${f.id}`
