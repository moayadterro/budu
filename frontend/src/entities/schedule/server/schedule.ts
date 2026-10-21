import 'server-only'
import { defaultInstance, iomadCall } from '@/shared/server/iomad'
import type { CalendarItem, LessonSeries } from '../model/types'

/** Timetable in IOMAD (Moodle calendar events via local_budu schedule functions). SERVER-SIDE ONLY. */

const call = <T>(fn: string, params: Record<string, unknown>) => iomadCall<T>(defaultInstance(), `local_budu_${fn}`, params)
type Id = { id: number }

type RawItem = {
  id: number
  kind: CalendarItem['kind']
  name: string
  description: string
  timestart: number
  duration: number
  courseid: number
  coursename: string
  classname: string
  teachers: string
  school: string
  seriesid: number
}

/** What the user should see between two unix times (lessons of their courses / class, school events). */
export async function myWeek(userId: number, from: number, to: number): Promise<CalendarItem[]> {
  const rows = await call<RawItem[]>('my_week', { userid: userId, from, to })
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.name,
    description: r.description,
    start: r.timestart,
    duration: r.duration,
    courseId: r.courseid || null,
    courseTitle: r.coursename,
    className: r.classname,
    teachers: r.teachers,
    school: r.school,
    seriesId: r.seriesid || null,
  }))
}

export async function courseSeries(userId: number, courseId: number): Promise<LessonSeries[]> {
  const rows = await call<Array<{ id: number; first: number; last: number; count: number; duration: number; description: string; classname: string }>>(
    'course_series',
    { userid: userId, courseid: courseId },
  )
  return rows.map((r) => ({ ...r, className: r.classname }))
}

/** Adds lessons at the given start times (computed in the browser's time zone) for the course or one class. */
export const addLessons = (userId: number, courseId: number, classId: number, description: string, duration: number, starts: number[]) =>
  call<Id>('add_lessons', { userid: userId, courseid: courseId, classid: classId, description, duration, starts })

export const deleteSeries = (userId: number, courseId: number, seriesId: number) =>
  call<Id>('delete_series', { userid: userId, courseid: courseId, seriesid: seriesId })

export const addSchoolEvent = (userId: number, companyId: number, e: { title: string; description: string; start: number; duration: number }) =>
  call<Id>('add_school_event', { companyid: companyId, userid: userId, name: e.title, description: e.description, timestart: e.start, duration: e.duration })

export const deleteSchoolEvent = (userId: number, companyId: number, eventId: number) =>
  call<Id>('delete_school_event', { companyid: companyId, userid: userId, eventid: eventId })
