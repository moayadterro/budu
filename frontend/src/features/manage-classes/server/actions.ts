'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCourse, listStudents } from '@/entities/course/server'
import { notify } from '@/entities/notification/server'
import {
  deleteClass,
  getClass,
  linkClassCourse,
  saveClass,
  setClassStudents,
  setClassTeachers,
} from '@/entities/school-class/server'
import { requireRole } from '@/entities/session/server'
import { getTenantName } from '@/entities/tenant/server'
import { formId, formText } from '@/shared/lib/form'

export type ClassFormState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; at: number }

const NAME_MAX = 100
const ids = (form: FormData, key: string) =>
  form
    .getAll(key)
    .map((v) => Number(v))
    .filter((n) => Number.isSafeInteger(n) && n > 0)
const refresh = () => revalidatePath('/', 'layout')

/** Manager creates a class, then opens it. */
export async function createClassAction(_prev: ClassFormState, form: FormData): Promise<ClassFormState> {
  const user = await requireRole('manager')
  const name = formText(form, 'name').slice(0, NAME_MAX)
  if (!user.companyId || !name) return { status: 'error', at: Date.now() }
  let id: number
  try {
    id = await saveClass(user.userId, user.companyId, 0, name, formText(form, 'description').slice(0, 1000))
  } catch (e) {
    console.error('create class failed', e)
    return { status: 'error', at: Date.now() }
  }
  refresh()
  redirect(`/school/classes/${id}`)
}

export async function renameClassAction(_prev: ClassFormState, form: FormData): Promise<ClassFormState> {
  const user = await requireRole('manager')
  const classId = formId(form, 'classId')
  const name = formText(form, 'name').slice(0, NAME_MAX)
  if (!user.companyId || !classId || !name) return { status: 'error', at: Date.now() }
  try {
    await saveClass(user.userId, user.companyId, classId, name, formText(form, 'description').slice(0, 1000))
  } catch (e) {
    console.error('rename class failed', e)
    return { status: 'error', at: Date.now() }
  }
  refresh()
  return { status: 'saved', at: Date.now() }
}

export async function deleteClassAction(form: FormData) {
  const user = await requireRole('manager')
  const classId = formId(form, 'classId')
  if (!classId) return
  await deleteClass(user.userId, classId)
  refresh()
  redirect('/school/classes')
}

/** Adds students to a class (they are told) — cohort sync enrols them into the class's courses. */
export async function addStudentsAction(_prev: ClassFormState, form: FormData): Promise<ClassFormState> {
  const user = await requireRole('manager')
  const classId = formId(form, 'classId')
  const add = ids(form, 'studentId')
  if (!classId || !add.length) return { status: 'error', at: Date.now() }
  try {
    await setClassStudents(user.userId, classId, add, [])
    const cls = await getClass(user.userId, classId)
    if (cls) {
      const school = (await getTenantName(cls.companyId)) ?? ''
      const added = cls.students.filter((s) => add.includes(s.id))
      await notify(added, 'addedToClass', { class: cls.name, school, by: user.name }, '/classes')
    }
  } catch (e) {
    console.error('add students failed', e)
    return { status: 'error', at: Date.now() }
  }
  refresh()
  return { status: 'saved', at: Date.now() }
}

export async function removeFromClassAction(form: FormData) {
  const user = await requireRole('manager')
  const classId = formId(form, 'classId')
  const studentId = formId(form, 'studentId')
  if (!classId || !studentId) return
  await setClassStudents(user.userId, classId, [], [studentId])
  refresh()
}

export async function saveClassTeachersAction(_prev: ClassFormState, form: FormData): Promise<ClassFormState> {
  const user = await requireRole('manager')
  const classId = formId(form, 'classId')
  if (!classId) return { status: 'error', at: Date.now() }
  try {
    await setClassTeachers(user.userId, classId, ids(form, 'teacherId'))
  } catch (e) {
    console.error('save class teachers failed', e)
    return { status: 'error', at: Date.now() }
  }
  refresh()
  return { status: 'saved', at: Date.now() }
}

/**
 * Enrols a whole class into a course (manager, or a teacher of that course). Its students are told.
 * The plugin checks the course and the class belong to the same school.
 */
export async function linkClassAction(_prev: ClassFormState, form: FormData): Promise<ClassFormState> {
  const user = await requireRole('manager', 'teacher')
  const classId = formId(form, 'classId')
  const courseId = formId(form, 'courseId')
  if (!classId || !courseId) return { status: 'error', at: Date.now() }
  try {
    // tell only the students the class newly brings into the course
    const before = new Set((await listStudents(user.userId, courseId)).map((s) => s.id))
    await linkClassCourse(user.userId, classId, courseId, true)
    const [after, course] = await Promise.all([listStudents(user.userId, courseId), getCourse(user.userId, courseId)])
    if (course?.published) {
      await notify(after.filter((s) => !before.has(s.id)), 'enrolled', { course: course.title, by: user.name }, `/classes/${courseId}`)
    }
  } catch (e) {
    console.error('link class failed', e)
    return { status: 'error', at: Date.now() }
  }
  refresh()
  return { status: 'saved', at: Date.now() }
}

export async function unlinkClassAction(form: FormData) {
  const user = await requireRole('manager', 'teacher')
  const classId = formId(form, 'classId')
  const courseId = formId(form, 'courseId')
  if (!classId || !courseId) return
  await linkClassCourse(user.userId, classId, courseId, false)
  refresh()
}
