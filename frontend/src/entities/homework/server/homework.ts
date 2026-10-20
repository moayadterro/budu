import 'server-only'
import { defaultInstance, iomadCall, iomadUpload, IomadError } from '@/shared/server/iomad'
import { toPerson, type RawPerson } from '@/shared/lib/person'
import type { Gradebook, HomeworkDetail, HomeworkFile, StudentHomework, SubmissionDetail, SubmissionRow } from '../model/types'

/**
 * Homework, answers and grades in IOMAD (local_budu learning functions). SERVER-SIDE ONLY.
 * Every call passes the acting user; the plugin checks they teach the course / are enrolled in it.
 */

const call = <T>(fn: string, params: Record<string, unknown>) => iomadCall<T>(defaultInstance(), `local_budu_${fn}`, params)

type RawFile = { id: number; filename: string; filesize: number; mimetype: string }
type RawState = { status: StudentHomework['status']; grade: number; feedback: string; submittedat: number }
const file = (f: RawFile): HomeworkFile => ({ id: f.id, name: f.filename, size: f.filesize, mime: f.mimetype })
const state = (r: RawState) => ({
  status: r.status,
  grade: r.grade >= 0 ? Math.round(r.grade * 10) / 10 : null,
  feedback: r.feedback,
  submittedAt: r.submittedat || null,
})

/** Not found / no permission → null, so pages can 404. */
async function orNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p
  } catch (e) {
    if (e instanceof IomadError && e.code !== 'http') return null
    throw e
  }
}

// ----- student -----

export async function myHomework(userId: number, courseId = 0): Promise<StudentHomework[]> {
  const rows = await call<
    Array<RawState & { cmid: number; name: string; duedate: number; courseid: number; coursename: string; lessonid: number; lessonname: string }>
  >('my_homework', { userid: userId, courseid: courseId })
  return rows.map((r) => ({
    id: r.cmid,
    title: r.name,
    dueAt: r.duedate || null,
    courseId: r.courseid,
    courseTitle: r.coursename,
    lessonId: r.lessonid,
    lessonTitle: r.lessonname,
    ...state(r),
  }))
}

export async function getMyHomework(userId: number, homeworkId: number): Promise<HomeworkDetail | null> {
  const r = await orNull(
    call<
      RawState & {
        cmid: number
        name: string
        instructions: string
        duedate: number
        courseid: number
        coursename: string
        attachments: RawFile[]
        text: string
        files: RawFile[]
      }
    >('my_submission', { userid: userId, cmid: homeworkId }),
  )
  if (!r) return null
  return {
    id: r.cmid,
    title: r.name,
    instructions: r.instructions,
    dueAt: r.duedate || null,
    courseId: r.courseid,
    courseTitle: r.coursename,
    attachments: r.attachments.map(file),
    answer: r.text,
    files: r.files.map(file),
    ...state(r),
  }
}

/** Hands in the student's answer; `files` (if any) replace the files handed in before. */
export async function submitHomework(userId: number, homeworkId: number, answer: string, files: File[]) {
  let draft = 0
  for (const f of files) draft = await iomadUpload(defaultInstance(), f, draft)
  return call<{ id: number }>('submit', { userid: userId, cmid: homeworkId, text: answer, draftitemid: draft })
}

// ----- teacher -----

/** Handed-in answers in the teacher's courses (optionally one course / one homework), newest first. */
export async function listSubmissions(
  userId: number,
  companyId: number,
  filter: { courseId?: number; homeworkId?: number } = {},
): Promise<SubmissionRow[]> {
  const rows = await call<
    Array<RawState & { cmid: number; homework: string; duedate: number; courseid: number; coursename: string; student: RawPerson }>
  >('submissions', { userid: userId, companyid: companyId, courseid: filter.courseId ?? 0, cmid: filter.homeworkId ?? 0 })
  return rows.map((r) => ({
    homeworkId: r.cmid,
    homeworkTitle: r.homework,
    dueAt: r.duedate || null,
    courseId: r.courseid,
    courseTitle: r.coursename,
    student: toPerson(r.student),
    ...state(r),
  }))
}

export async function getSubmission(userId: number, homeworkId: number, studentId: number): Promise<SubmissionDetail | null> {
  const r = await orNull(
    call<RawState & { cmid: number; homework: string; duedate: number; student: RawPerson; text: string; files: RawFile[] }>(
      'get_submission',
      { userid: userId, cmid: homeworkId, studentid: studentId },
    ),
  )
  if (!r) return null
  return {
    homeworkId: r.cmid,
    homeworkTitle: r.homework,
    dueAt: r.duedate || null,
    student: toPerson(r.student),
    answer: r.text,
    files: r.files.map(file),
    ...state(r),
  }
}

export const gradeSubmission = (userId: number, homeworkId: number, studentId: number, grade: number, feedback: string) =>
  call<{ id: number }>('grade', { userid: userId, cmid: homeworkId, studentid: studentId, grade, feedback })

export async function getGradebook(userId: number, courseId: number): Promise<Gradebook | null> {
  const r = await orNull(
    call<{
      courseid: number
      coursename: string
      homework: Array<{ cmid: number; name: string; duedate: number }>
      rows: Array<{ student: RawPerson; cells: Array<{ cmid: number; status: StudentHomework['status']; grade: number }> }>
    }>('gradebook', { courseid: courseId, userid: userId }),
  )
  if (!r) return null
  return {
    courseId: r.courseid,
    courseTitle: r.coursename,
    homework: r.homework.map((h) => ({ id: h.cmid, title: h.name, dueAt: h.duedate || null })),
    rows: r.rows.map((row) => ({
      student: toPerson(row.student),
      cells: row.cells.map((c) => ({ homeworkId: c.cmid, status: c.status, grade: c.grade >= 0 ? c.grade : null })),
    })),
  }
}
