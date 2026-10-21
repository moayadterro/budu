/**
 * Quizzes and exams (Moodle's quiz engine in IOMAD). A quiz belongs to a course; it can be limited to
 * some of the course's classes. "quiz" = practice (unlimited attempts, answers shown after submitting);
 * "exam" = one attempt, score after submitting, correct answers only after it closes.
 */
export type QuizKind = 'quiz' | 'exam'

export const QUESTION_TYPES = ['multichoice', 'truefalse', 'shortanswer', 'numerical', 'essay', 'match', 'ordering', 'gapselect'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** What each type stores (the editor's shape; IOMAD turns it into a Moodle question). */
export type QuestionData =
  | { type: 'multichoice'; multiple: boolean; options: Array<{ text: string; correct: boolean }> }
  | { type: 'truefalse'; correct: boolean }
  | { type: 'shortanswer'; answers: string[]; caseSensitive: boolean }
  | { type: 'numerical'; answers: Array<{ value: number; tolerance: number }> }
  | { type: 'essay'; graderInfo: string }
  | { type: 'match'; pairs: Array<{ left: string; right: string }> }
  | { type: 'ordering'; items: string[] }
  /** text has [[1]], [[2]] … gaps; choices[0] is the right word for [[1]] …, extra choices are distractors */
  | { type: 'gapselect'; choices: string[] }

export type Question = {
  slot: number
  questionId: number
  type: QuestionType
  text: string
  mark: number
  data: QuestionData & { explanation?: string }
}

export type QuizInfo = {
  id: number
  courseId: number
  name: string
  intro: string
  kind: QuizKind
  published: boolean
  /** unix seconds: when a scheduled quiz gets published (it's hidden from students until then); null = not scheduled */
  opensAt: number | null
  closesAt: number | null
  /** seconds, 0 = no limit */
  timeLimit: number
  /** 0 = unlimited */
  attempts: number
  /** 0–100, 0 = none */
  passMark: number
  /** [] = every student of the course */
  classIds: number[]
  /** a school exam (no course: the school's exam space; its own audience) */
  schoolExam: boolean
}

/** Someone who takes a school exam. */
export type ExamTaker = { id: number; name: string; email: string; pictureId: number | null; member: boolean; pending: boolean }

/** In the teacher's list. */
export type TeacherQuiz = QuizInfo & { questionCount: number; attemptCount: number; toGrade: number }

/** In the editor. */
export type QuizDetail = QuizInfo & { editable: boolean; questions: Question[] }

export type StudentQuizState = 'new' | 'inprogress' | 'finished' | 'closed'

/** As a student sees it. */
export type StudentQuiz = QuizInfo & {
  state: StudentQuizState
  canStart: boolean
  /** in progress, else the last finished one; 0 = none */
  attemptId: number
  attemptsUsed: number
  /** best grade 0–100, null = not shown (yet) */
  grade: number | null
  needsGrading: boolean
  courseTitle: string
}

/** One question of an attempt, ready to render. */
export type AttemptQuestion = {
  slot: number
  type: QuestionType
  text: string
  mark: number
  ui: {
    multiple?: boolean
    options?: Array<{ key: string; text: string }>
    stems?: Array<{ key: string; text: string }>
    choices?: Array<{ key: string; text: string }>
    items?: Array<{ key: string; text: string }>
    fragments?: string[]
    gaps?: Array<{ key: string; choices: Array<{ key: string; text: string }> }>
  }
  /** the saved answer: string | string[] | Record<string,string> | null, per type */
  answer: AttemptAnswer
}

export type AttemptAnswer = string | string[] | Record<string, string> | null

export type Attempt = {
  id: number
  quizId: number
  name: string
  finished: boolean
  /** unix seconds, null = no limit */
  endsAt: number | null
  /** server clock, to correct the browser's */
  serverNow: number
  questions: AttemptQuestion[]
}

export type ReviewResult = 'correct' | 'partiallycorrect' | 'incorrect' | 'needsgrading' | 'unanswered' | ''

export type Review = {
  id: number
  quizId: number
  name: string
  studentId: number
  submittedAt: number
  needsGrading: boolean
  /** 0–100, null = not shown yet */
  grade: number | null
  questions: Array<{
    slot: number
    type: QuestionType
    text: string
    response: string
    /** '' = hidden */
    rightAnswer: string
    /** null = hidden */
    mark: number | null
    maxMark: number
    result: ReviewResult
    comment: string
    explanation: string
  }>
}

export type QuizResults = QuizInfo & {
  students: Array<{
    id: number
    name: string
    email: string
    pictureId: number | null
    state: 'notstarted' | 'inprogress' | 'needsgrading' | 'finished'
    attemptId: number
    grade: number | null
    submittedAt: number | null
  }>
}
