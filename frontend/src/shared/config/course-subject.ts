/**
 * What a course is about (the teacher picks one in the listing; students filter the catalog by it).
 * Keys are stored with the course; names live in the dictionaries (`t.subjects`). Add a subject:
 * a key here + its name in en/ru/ar. Never rename a key (courses keep the old one).
 */
export const COURSE_SUBJECTS = [
  'math',
  'physics',
  'chemistry',
  'biology',
  'cs',
  'languages',
  'literature',
  'history',
  'geography',
  'economics',
  'exams',
  'art',
  'music',
  'sports',
  'other',
] as const
export type CourseSubject = (typeof COURSE_SUBJECTS)[number]

export const isCourseSubject = (v: unknown): v is CourseSubject => COURSE_SUBJECTS.includes(v as CourseSubject)
