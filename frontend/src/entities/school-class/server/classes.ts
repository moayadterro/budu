import 'server-only'
import { defaultInstance, iomadCall, IomadError } from '@/shared/server/iomad'
import { toPerson, type RawPerson } from '@/shared/lib/person'
import type { ClassDetail, SchoolClass } from '../model/types'

/**
 * School classes in IOMAD (cohorts, local_budu classes functions). SERVER-SIDE ONLY.
 * The plugin checks the acting user: managers change classes, class teachers read theirs.
 */

const call = <T>(fn: string, params: Record<string, unknown>) => iomadCall<T>(defaultInstance(), `local_budu_${fn}`, params)
type Id = { id: number }
type RawClass = {
  id: number
  name: string
  description: string
  students: number
  courses: number
  courseids: number[]
  teachers: RawPerson[]
  mine: boolean
}
const toClass = (c: RawClass): SchoolClass => ({
  id: c.id,
  name: c.name,
  description: c.description,
  studentCount: c.students,
  courseCount: c.courses,
  courseIds: c.courseids,
  teachers: c.teachers.map(toPerson),
  mine: c.mine,
})

/** The school's classes (managers and teachers of the school). */
export async function listClasses(userId: number, companyId: number): Promise<SchoolClass[]> {
  return (await call<RawClass[]>('list_classes', { companyid: companyId, userid: userId })).map(toClass)
}

/** A class with students, teachers and courses; null if missing or not allowed. */
export async function getClass(userId: number, classId: number): Promise<ClassDetail | null> {
  try {
    const c = await call<
      RawClass & {
        companyid: number
        canmanage: boolean
        studentlist: RawPerson[]
        courselist: Array<{ id: number; fullname: string; visible: boolean; teachers: string }>
      }
    >('get_class', { userid: userId, classid: classId })
    return {
      ...toClass(c),
      companyId: c.companyid,
      canManage: c.canmanage,
      students: c.studentlist.map(toPerson),
      courses: c.courselist.map((x) => ({ id: x.id, title: x.fullname, published: x.visible, teachers: x.teachers })),
    }
  } catch (e) {
    if (e instanceof IomadError && e.code !== 'http') return null
    throw e
  }
}

/** Classes the user is in (student) and classes they teach (class teacher). */
export async function myClasses(userId: number): Promise<{ member: SchoolClass[]; teaching: SchoolClass[] }> {
  const r = await call<{ member: RawClass[]; teaching: RawClass[] }>('my_classes', { userid: userId })
  return { member: r.member.map(toClass), teaching: r.teaching.map(toClass) }
}

/** Create (classId 0) or rename a class. */
export const saveClass = (userId: number, companyId: number, classId: number, name: string, description: string) =>
  call<Id>('save_class', { companyid: companyId, userid: userId, classid: classId, name, description }).then((r) => r.id)

export const deleteClass = (userId: number, classId: number) => call<Id>('delete_class', { userid: userId, classid: classId })

export const setClassStudents = (userId: number, classId: number, add: number[], remove: number[]) =>
  call<Id>('set_students', { userid: userId, classid: classId, add, remove })

export const setClassTeachers = (userId: number, classId: number, teacherIds: number[]) =>
  call<Id>('set_teachers', { userid: userId, classid: classId, teacherids: teacherIds })

/** Enrol the whole class into a course (cohort sync) or remove it. */
export const linkClassCourse = (userId: number, classId: number, courseId: number, link: boolean) =>
  call<Id>('link_course', { userid: userId, classid: classId, courseid: courseId, link: link ? 1 : 0 })
