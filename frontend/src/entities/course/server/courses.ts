import 'server-only'
import { defaultInstance, iomadCall, iomadUpload, IomadError } from '@/shared/server/iomad'
import type { Course, CourseSummary, LessonItem } from '../model/types'

/**
 * Courses, lessons, materials and tasks in IOMAD, via the local_budu plugin.
 * SERVER-SIDE ONLY. Every call passes the acting user's IOMAD id; the plugin
 * checks that user's rights (course teacher to edit, enrolled to view).
 */

type RawFile = { id: number; filename: string; filesize: number; mimetype: string }
type RawItem = { cmid: number; kind: LessonItem['kind']; name: string; instructions: string; duedate: number; files: RawFile[] }
type RawCourse = { id: number; fullname: string; summary: string; visible: boolean; lessons: number; timemodified: number }
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
