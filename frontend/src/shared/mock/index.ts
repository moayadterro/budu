/**
 * Mock data from the design prototype. Screens read from here until the IOMAD
 * Web Services client replaces it screen by screen.
 */
export type SubjectKey = 'math' | 'phys' | 'rus' | 'eng' | 'ar'
export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri'

export type Subject = {
  teacher: string
  initials: string
  /** token-based colour, used as the subject's accent */
  color: string
  icon: 'calc' | 'atom' | 'book' | 'lang' | 'arabic'
  progress: number
}

export const SUBJECTS: Record<SubjectKey, Subject> = {
  math: { teacher: 'Omar Haddad', initials: 'OH', color: 'var(--color-primary)', icon: 'calc', progress: 60 },
  phys: { teacher: 'Sergey Kuznetsov', initials: 'SK', color: 'var(--color-info)', icon: 'atom', progress: 35 },
  rus: { teacher: 'Dmitry Volkov', initials: 'DV', color: 'var(--color-subject-purple)', icon: 'book', progress: 80 },
  eng: { teacher: 'Anna Petrova', initials: 'AP', color: 'var(--color-highlight)', icon: 'lang', progress: 45 },
  ar: { teacher: 'Layla Nasser', initials: 'LN', color: 'var(--color-subject-terra)', icon: 'arabic', progress: 20 },
}

export const DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri']
export const DATES: Record<Day, number> = { mon: 15, tue: 16, wed: 17, thu: 18, fri: 19 }
export const TODAY: Day = 'thu'
export const TIMES = ['09:00', '10:30', '12:00', '14:00']

/** Weekly grid: one row per time slot, each a map of day → subject. */
export const WEEK: Array<Partial<Record<Day, SubjectKey>>> = [
  { mon: 'phys', tue: 'math', wed: 'eng', thu: 'rus', fri: 'math' },
  { mon: 'math', tue: 'eng', wed: 'rus', thu: 'math', fri: 'phys' },
  { mon: 'rus', tue: 'phys', wed: 'math', thu: 'phys', fri: 'eng' },
  { mon: 'eng', tue: 'ar', wed: 'phys', thu: 'ar', fri: 'rus' },
]

/** The lesson that is live right now (row index + day). */
export const LIVE = { row: 1, day: 'thu' as Day }
export const isLive = (row: number, day: Day) => row === LIVE.row && day === LIVE.day

export const SUBJECT_KEYS = Object.keys(SUBJECTS) as SubjectKey[]
export const isSubject = (k: string): k is SubjectKey => k in SUBJECTS

export const STUDENT = { firstName: 'Yusuf', fullName: 'Yusuf Khan', initials: 'YK', className: '10-A' }

export const HOMEWORK = [
  { title: 'Homework 3: Derivatives', meta: 'Mathematics · Omar Haddad', due: 'Today', urgent: true },
  { title: 'Lab report: Friction', meta: 'Physics · Sergey K.', due: 'Tomorrow', urgent: false },
  { title: 'Essay: My city', meta: 'Russian · Dmitry V.', due: 'In 3 days', urgent: false },
]


/* ---- class hub ---- */
export const HUB = {
  teacher: 'Omar Haddad',
  students: 28,
  liveTitle: 'Derivatives in practice',
}

export type LessonState = 'done' | 'progress' | 'live'
export const LESSONS: Array<{ title: string; meta: string; minutes: number; state: LessonState }> = [
  { title: '1 · Limits & continuity', meta: 'Recorded · 48 min · watched', minutes: 48, state: 'done' },
  { title: '2 · Intro to derivatives', meta: 'Recorded · 52 min · 60%', minutes: 52, state: 'progress' },
  { title: '3 · Derivatives in practice', meta: 'Live · today 10:30', minutes: 60, state: 'live' },
]

export const CLASS_HOMEWORK = [
  { title: 'Homework 3: Derivatives', meta: '10 problems · due today', graded: false },
  { title: 'Homework 2: Limits', meta: 'Graded · 92/100', graded: true },
]

export const CLASSMATES = [
  { name: 'Maria I.', initials: 'MI', color: 'var(--color-info)' },
  { name: 'Yusuf K.', initials: 'YK', color: 'var(--color-primary)' },
  { name: 'Elena K.', initials: 'EK', color: 'var(--color-highlight)' },
  { name: 'Ahmed H.', initials: 'AH', color: 'var(--color-subject-purple)' },
  { name: 'Dana P.', initials: 'DP', color: 'var(--color-subject-terra)' },
  { name: 'Ivan S.', initials: 'IS', color: 'var(--color-success)' },
]

/* ---- lesson page (the in-progress lesson) ---- */
export const LESSON = {
  breadcrumb: 'Grade 10-A · Mathematics',
  title: '2 · Intro to derivatives',
  meta: 'Recorded · 52 min · with Omar Haddad',
  position: '12:40 / 52:00',
  watched: 24,
  description:
    'A step-by-step introduction to the derivative: the slope of a curve at a point, the limit definition, and the power rule. Watch, then try the practice set before the live session.',
  materials: [
    { name: 'Derivatives — notes.pdf', size: '1.2 MB', color: 'var(--color-destructive)' },
    { name: 'Practice set.pdf', size: '640 KB', color: 'var(--color-info)' },
  ],
}

/* ---- homework page ---- */
export const ASSIGNMENT = {
  due: 'Due today · 18:00',
  course: 'Mathematics · Grade 10-A · Omar Haddad',
  title: 'Homework 3: Derivatives',
  instructions:
    'Solve all 10 problems using the power rule. Show every step of your working. Submit as a PDF or type your answers below before 18:00 today.',
  file: { name: 'problems.pdf', size: '820 KB' },
}

/* ---- explore (marketplace) ---- */
export type CourseMode = 'live' | 'self'
export const CATALOG: Array<{
  title: string
  by: string
  initials: string
  subject: SubjectKey
  icon: 'calc' | 'mic' | 'atom'
  mode: CourseMode
  rating: string
  price: number
}> = [
  { title: 'Advanced Calculus', by: 'Omar Haddad', initials: 'OH', subject: 'math', icon: 'calc', mode: 'live', rating: '4.9', price: 89 },
  { title: 'Arabic for Beginners', by: 'Layla Nasser', initials: 'LN', subject: 'ar', icon: 'mic', mode: 'self', rating: '5.0', price: 39 },
  { title: 'Physics Olympiad Prep', by: 'Sergey K.', initials: 'SK', subject: 'phys', icon: 'atom', mode: 'live', rating: '4.6', price: 0 },
]

/* ---- live classroom ---- */
export const LIVE_CLASS = {
  title: 'Mathematics — Derivatives · Grade 10-A',
  slideTitle: 'The Power Rule',
  formula: 'd/dx [ xⁿ ] = n·xⁿ⁻¹',
  participants: 28,
  tiles: [
    { name: 'Omar', initials: 'OH', color: 'var(--color-info)', host: true, hand: false },
    { name: 'Maria', initials: 'MI', color: 'var(--color-subject-purple)', host: false, hand: false },
    { name: 'Yusuf', initials: 'YK', color: 'var(--color-primary)', host: false, hand: true },
    { name: 'Elena', initials: 'EK', color: 'var(--color-highlight)', host: false, hand: false },
  ],
  chat: [
    { name: 'Omar Haddad', initials: 'OH', color: 'var(--color-info)', text: 'Who can tell me the derivative of x³?' },
    { name: 'Maria', initials: 'MI', color: 'var(--color-subject-purple)', text: '3x² 🙌' },
    { name: 'Yusuf', initials: 'YK', color: 'var(--color-primary)', text: 'Raised hand — can you explain again?' },
  ],
}
