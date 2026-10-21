import 'server-only'
import { defaultInstance, iomadCall, iomadUpload, IomadError } from '@/shared/server/iomad'
import { toPerson, type Person, type RawPerson } from '@/shared/lib/person'
import type { Course, CourseSummary, EnrolResult, LessonItem, StudentCourse } from '../model/types'

/**
 * Courses, lessons, materials and tasks in IOMAD, via the local_budu plugin.
 * SERVER-SIDE ONLY. Every call passes the acting user's IOMAD id; the plugin
 * checks that user's rights (course teacher to edit, enrolled to view).
 */

type RawFile = { id: number; filename: string; filesize: number; mimetype: string }
type RawItem = { cmid: number; kind: LessonItem['kind']; name: string; instructions: string; duedate: number; files: RawFile[]; content?: string }
type RawCourse = { id: number; fullname: string; summary: string; visible: boolean; lessons: number; timemodified: number; image?: number }
type RawFullCourse = RawCourse & {
  canedit: boolean
  lessonlist: Array<{ id: number; name: string; summary: string; items: RawItem[] }>
}

const summary = (c: RawCourse): CourseSummary => ({
  id: c.id,
  title: c.fullname,
  description: c.summary,
  published: c.visible,
  lessonCount: c.lessons,
  updatedAt: c.timemodified,
  imageId: c.image || null,
})

const call = <T>(fn: string, params: Record<string, unknown>) => iomadCall<T>(defaultInstance(), `local_budu_${fn}`, params)
type Id = { id: number }

/** Courses the user teaches in their tenant (IOMAD company). */
export async function listTeacherCourses(userId: number, companyId: number): Promise<CourseSummary[]> {
  const rows = await call<RawCourse[]>('list_courses', { companyid: companyId, userid: userId })
  return rows.map(summary)
}

/** The course as this user may see it; null if it doesn't exist or they have no access. */
export async function getCourse(userId: number, courseId: number): Promise<Course | null> {
  try {
    const c = await call<RawFullCourse>('get_course', { courseid: courseId, userid: userId })
    return {
      ...summary(c),
      canEdit: c.canedit,
      lessons: c.lessonlist.map((l) => ({
        id: l.id,
        title: l.name,
        description: l.summary,
        items: l.items.map((i) => ({
          id: i.cmid,
          kind: i.kind,
          name: i.name,
          instructions: i.instructions,
          dueAt: i.duedate || null,
          files: i.files.map((f) => ({ id: f.id, name: f.filename, size: f.filesize, mime: f.mimetype })),
          content: i.content ?? '',
        })),
      })),
    }
  } catch (e) {
    // no permission / no such course: treat both as "not found"
    if (e instanceof IomadError && e.code !== 'http') return null
    throw e
  }
}

export const createCourse = (userId: number, companyId: number, title: string, description: string) =>
  call<Id>('create_course', { companyid: companyId, userid: userId, fullname: title, summary: description }).then((r) => r.id)

export const updateCourse = (userId: number, courseId: number, c: { title: string; description: string; published: boolean }) =>
  call<Id>('update_course', { courseid: courseId, userid: userId, fullname: c.title, summary: c.description, visible: c.published ? 1 : 0 })

/** Adds a lesson at the end (lessonId 0) or renames one. */
export const saveLesson = (userId: number, courseId: number, lessonId: number, title: string, description: string) =>
  call<Id>('save_lesson', { courseid: courseId, userid: userId, sectionid: lessonId, name: title, summary: description })

export const deleteLesson = (userId: number, courseId: number, lessonId: number) =>
  call<Id>('delete_lesson', { courseid: courseId, userid: userId, sectionid: lessonId })

export const moveLesson = (userId: number, courseId: number, lessonId: number, direction: -1 | 1) =>
  call<Id>('move_lesson', { courseid: courseId, userid: userId, sectionid: lessonId, direction })

/** Uploads a file and adds it to a lesson as a material (video / PDF / other). */
export async function addMaterial(userId: number, courseId: number, lessonId: number, file: File, name: string) {
  const draft = await iomadUpload(defaultInstance(), file)
  return call<Id>('add_material', { courseid: courseId, userid: userId, sectionid: lessonId, name, draftitemid: draft })
}

/** Adds a task to a lesson (taskId 0) or changes one; `file` replaces the attachment. */
export async function saveTask(
  userId: number,
  courseId: number,
  lessonId: number,
  taskId: number,
  task: { name: string; instructions: string; dueAt: number | null; file: File | null },
) {
  const draft = task.file ? await iomadUpload(defaultInstance(), task.file) : 0
  return call<Id>('save_task', {
    courseid: courseId,
    userid: userId,
    sectionid: lessonId,
    cmid: taskId,
    name: task.name,
    instructions: task.instructions,
    duedate: task.dueAt ?? 0,
    draftitemid: draft,
  })
}

/** Adds a text page to a lesson (pageId 0) or changes one. IOMAD cleans the HTML. */
export const savePage = (userId: number, courseId: number, lessonId: number, pageId: number, page: { name: string; html: string }) =>
  call<Id>('save_page', { courseid: courseId, userid: userId, sectionid: lessonId, cmid: pageId, name: page.name, content: page.html })

export const deleteLessonItem = (userId: number, courseId: number, itemId: number) =>
  call<Id>('delete_item', { courseid: courseId, userid: userId, cmid: itemId })

export type FileAccess = { allowed: false } | { allowed: true; path: string; name: string; size: number; mime: string }

/** May this user open this lesson file? If so, its IOMAD location. */
export async function lessonFileAccess(userId: number, fileId: number): Promise<FileAccess> {
  const r = await call<{ allowed: boolean; path: string; filename: string; filesize: number; mimetype: string }>('file_access', {
    userid: userId,
    fileid: fileId,
  })
  return r.allowed ? { allowed: true, path: r.path, name: r.filename, size: r.filesize, mime: r.mimetype } : { allowed: false }
}

// ----- students (local_budu learning functions) -----

/** Students enrolled in a course the user teaches. */
export async function listStudents(userId: number, courseId: number): Promise<Person[]> {
  const rows = await call<RawPerson[]>('list_students', { courseid: courseId, userid: userId })
  return rows.map(toPerson)
}

/** Enrol an existing Budu account (by email) as a student. */
export async function enrolStudent(userId: number, courseId: number, email: string): Promise<EnrolResult> {
  const r = await call<{ result: EnrolResult }>('enrol_student', { courseid: courseId, userid: userId, email })
  return r.result
}

export const unenrolStudent = (userId: number, courseId: number, studentId: number) =>
  call<Id>('unenrol_student', { courseid: courseId, userid: userId, studentid: studentId })

/** Published courses the user is enrolled in as a student. */
export async function myCourses(userId: number): Promise<StudentCourse[]> {
  const rows = await call<
    Array<{ id: number; fullname: string; summary: string; teachers: string; lessons: number; homework: number; todo: number }>
  >('my_courses', { userid: userId })
  return rows.map((c) => ({
    id: c.id,
    title: c.fullname,
    description: c.summary,
    teachers: c.teachers,
    lessonCount: c.lessons,
    homeworkCount: c.homework,
    todo: c.todo,
  }))
}

/** The IOMAD company (school / teacher tenant) that owns the course; null if none. */
export async function courseCompany(courseId: number): Promise<number | null> {
  const r = await call<{ companyid: number }>('course_company', { courseid: courseId })
  return r.companyid || null
}

// ----- marketplace (Explore) -----

export type CatalogCourse = {
  id: number
  title: string
  description: string
  school: string
  teachers: Person[]
  lessons: string[]
  /** the viewer is enrolled already */
  enrolled: boolean
  /** cover image file id, null = generated cover */
  imageId: number | null
}

/** Public facts of these (listed) courses; unpublished ones are left out. */
export async function catalog(courseIds: number[], viewerId = 0): Promise<CatalogCourse[]> {
  if (!courseIds.length) return []
  const rows = await call<
    Array<{ id: number; fullname: string; summary: string; school: string; teachers: RawPerson[]; lessons: string[]; enrolled: boolean; image: number }>
  >('catalog', { courseids: courseIds, userid: viewerId })
  return rows.map((r) => ({
    id: r.id,
    title: r.fullname,
    description: r.summary,
    school: r.school,
    teachers: r.teachers.map(toPerson),
    lessons: r.lessons,
    enrolled: r.enrolled,
    imageId: r.image || null,
  }))
}

/** Set (an image file) or remove (null) the course's cover image. Returns the new image id, or null. */
export async function setCourseImage(userId: number, courseId: number, file: File | null): Promise<number | null> {
  const draft = file ? await iomadUpload(defaultInstance(), file) : 0
  const r = await call<{ id: number }>('set_course_image', { courseid: courseId, userid: userId, draftitemid: draft })
  return r.id || null
}

/** Enrol a learner (the caller decided they may: free course, or a confirmed payment). */
export const enrolLearner = (courseId: number, userId: number) =>
  call<{ result: 'enrolled' | 'already' }>('enrol_learner', { courseid: courseId, userid: userId })
