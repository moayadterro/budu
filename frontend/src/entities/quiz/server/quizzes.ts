import 'server-only'
import { defaultInstance, iomadCall, IomadError } from '@/shared/server/iomad'
import type {
  ExamTaker,
  Attempt,
  AttemptQuestion,
  Question,
  QuestionData,
  QuizDetail,
  QuizInfo,
  QuizKind,
  QuizResults,
  Review,
  StudentQuiz,
  TeacherQuiz,
} from '../model/types'

/**
 * Quizzes and exams in IOMAD (local_budu quizzes functions). SERVER-SIDE ONLY. Every call passes the
 * acting user; the plugin checks they teach the course / may take the quiz.
 */

const call = <T>(fn: string, params: Record<string, unknown>) => iomadCall<T>(defaultInstance(), `local_budu_${fn}`, params)

async function orNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p
  } catch (e) {
    if (e instanceof IomadError && e.code !== 'http') return null
    throw e
  }
}

type RawInfo = {
  cmid: number
  courseid: number
  name: string
  intro: string
  kind: QuizKind
  published: boolean
  timeopen: number
  timeclose: number
  timelimit: number
  attempts: number
  gradepass: number
  classids: number[]
  schoolexam?: boolean
}
const info = (r: RawInfo): QuizInfo => ({
  id: r.cmid,
  courseId: r.courseid,
  name: r.name,
  intro: r.intro,
  kind: r.kind === 'exam' ? 'exam' : 'quiz',
  published: r.published,
  opensAt: r.timeopen || null,
  closesAt: r.timeclose || null,
  timeLimit: r.timelimit,
  attempts: r.attempts,
  passMark: r.gradepass,
  classIds: r.classids,
  schoolExam: !!r.schoolexam,
})
const grade = (g: number) => (g >= 0 ? Math.round(g * 10) / 10 : null)

// ----- teacher -----

export async function courseQuizzes(userId: number, courseId: number): Promise<TeacherQuiz[]> {
  const rows = await call<Array<RawInfo & { questions: number; attemptcount: number; tograde: number }>>('course_quizzes', {
    courseid: courseId,
    userid: userId,
  })
  return rows.map((r) => ({ ...info(r), questionCount: r.questions, attemptCount: r.attemptcount, toGrade: r.tograde }))
}

export type QuizSettings = {
  name: string
  intro: string
  kind: QuizKind
  closesAt: number | null
  timeLimit: number
  passMark: number
  classIds: number[]
}

/** Create (quizId 0 → a hidden draft) or change a quiz. Returns its id. */
export async function saveQuiz(userId: number, courseId: number, quizId: number, s: QuizSettings) {
  const r = await call<{ id: number }>('save_quiz', {
    courseid: courseId,
    userid: userId,
    cmid: quizId,
    name: s.name,
    intro: s.intro,
    kind: s.kind,
    timeclose: s.closesAt ?? 0,
    timelimit: s.timeLimit,
    gradepass: s.passMark,
    classids: s.classIds,
  })
  return r.id
}

type RawQuestion = { slot: number; questionid: number; type: Question['type']; text: string; mark: number; data: string }

export async function getQuiz(userId: number, quizId: number): Promise<QuizDetail | null> {
  const r = await orNull(call<RawInfo & { editable: boolean; questionlist: RawQuestion[] }>('get_quiz', { cmid: quizId, userid: userId }))
  if (!r) return null
  return {
    ...info(r),
    editable: r.editable,
    questions: r.questionlist.map((q) => ({
      slot: q.slot,
      questionId: q.questionid,
      type: q.type,
      text: q.text,
      mark: q.mark,
      data: { type: q.type, ...JSON.parse(q.data) } as Question['data'],
    })),
  }
}

/** Publish now (publishAt null), schedule publishing (hidden until then), or hide. */
export const publishQuiz = (userId: number, quizId: number, published: boolean, publishAt: number | null = null) =>
  call('publish_quiz', { cmid: quizId, userid: userId, published: published ? 1 : 0, publishat: publishAt ?? 0 })

export const deleteQuiz = (userId: number, quizId: number) => call('delete_quiz', { cmid: quizId, userid: userId })

/** Add (slot 0) or change a question. `text` keeps [[n]] gaps for gapselect. */
export const saveQuestion = (userId: number, quizId: number, slot: number, q: { text: string; mark: number; data: QuestionData & { explanation?: string } }) => {
  const { type, ...data } = q.data
  return call<{ id: number }>('save_question', { cmid: quizId, userid: userId, slot, type, text: q.text, mark: q.mark, data: JSON.stringify(data) })
}

/** direction 0 = remove, −1 / 1 = move up / down. */
export const moveQuestion = (userId: number, quizId: number, slot: number, direction: -1 | 0 | 1) =>
  call('remove_question', { cmid: quizId, userid: userId, slot, direction })

export async function quizResults(userId: number, quizId: number): Promise<QuizResults | null> {
  const r = await orNull(
    call<
      RawInfo & {
        students: Array<{ id: number; name: string; email: string; picture: number; state: QuizResults['students'][number]['state']; attemptid: number; grade: number; timefinish: number }>
      }
    >('quiz_results', { cmid: quizId, userid: userId }),
  )
  if (!r) return null
  return {
    ...info(r),
    students: r.students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      pictureId: s.picture || null,
      state: s.state,
      attemptId: s.attemptid,
      grade: grade(s.grade),
      submittedAt: s.timefinish || null,
    })),
  }
}

type RawReview = {
  id: number
  cmid: number
  name: string
  userid: number
  timefinish: number
  needsgrading: boolean
  grade: number
  questions: Array<{
    slot: number
    type: Question['type']
    text: string
    response: string
    rightanswer: string
    mark: number
    maxmark: number
    result: Review['questions'][number]['result']
    comment: string
    explanation: string
  }>
}
const review = (r: RawReview): Review => ({
  id: r.id,
  quizId: r.cmid,
  name: r.name,
  studentId: r.userid,
  submittedAt: r.timefinish,
  needsGrading: r.needsgrading,
  grade: grade(r.grade),
  questions: r.questions.map((q) => ({
    slot: q.slot,
    type: q.type,
    text: q.text,
    response: q.response,
    rightAnswer: q.rightanswer,
    mark: q.mark >= 0 ? Math.round(q.mark * 100) / 100 : null,
    maxMark: q.maxmark,
    result: q.result,
    comment: q.comment,
    explanation: q.explanation,
  })),
})

export async function teacherReview(userId: number, attemptId: number) {
  const r = await orNull(call<RawReview>('teacher_review', { attemptid: attemptId, userid: userId }))
  return r ? review(r) : null
}

export const gradeAnswer = (userId: number, attemptId: number, slot: number, mark: number, comment: string) =>
  call<{ needsgrading: boolean; studentid: number }>('grade_answer', { attemptid: attemptId, userid: userId, slot, mark, comment })

// ----- student -----

type RawStudent = RawInfo & {
  state: StudentQuiz['state']
  canstart: boolean
  attemptid: number
  attemptsused: number
  grade: number
  needsgrading: boolean
  coursename: string
}
const studentQuiz = (r: RawStudent): StudentQuiz => ({
  ...info(r),
  state: r.state,
  canStart: r.canstart,
  attemptId: r.attemptid,
  attemptsUsed: r.attemptsused,
  grade: grade(r.grade),
  needsGrading: r.needsgrading,
  courseTitle: r.coursename,
})

/** The student's quizzes and exams (one course, or all). Also used for a parent's view of a child. */
export async function myQuizzes(userId: number, courseId = 0): Promise<StudentQuiz[]> {
  return (await call<RawStudent[]>('my_quizzes', { userid: userId, courseid: courseId })).map(studentQuiz)
}

export async function quizForStudent(userId: number, quizId: number): Promise<(StudentQuiz & { questionCount: number }) | null> {
  const r = await orNull(call<RawStudent & { questions: number }>('quiz_for_student', { cmid: quizId, userid: userId }))
  return r ? { ...studentQuiz(r), questionCount: r.questions } : null
}

export const startAttempt = (userId: number, quizId: number) => call<{ id: number }>('start_attempt', { cmid: quizId, userid: userId }).then((r) => r.id)

export async function getAttempt(userId: number, attemptId: number): Promise<Attempt | null> {
  const r = await orNull(
    call<{
      id: number
      cmid: number
      name: string
      finished: boolean
      endtime: number
      now: number
      questions: Array<{ slot: number; type: Question['type']; text: string; mark: number; ui: string; answer: string }>
    }>('get_attempt', { attemptid: attemptId, userid: userId }),
  )
  if (!r) return null
  return {
    id: r.id,
    quizId: r.cmid,
    name: r.name,
    finished: r.finished,
    endsAt: r.endtime || null,
    serverNow: r.now,
    questions: r.questions.map(
      (q): AttemptQuestion => ({ slot: q.slot, type: q.type, text: q.text, mark: q.mark, ui: JSON.parse(q.ui), answer: JSON.parse(q.answer) }),
    ),
  }
}

/** Save answers ({slot: answer}); `finish` submits. */
export const saveAttempt = (userId: number, attemptId: number, answers: Record<number, unknown>, finish: boolean) =>
  call<{ finished: boolean; needsgrading: boolean }>('save_attempt', {
    attemptid: attemptId,
    userid: userId,
    answers: JSON.stringify(answers),
    finish: finish ? 1 : 0,
  })

export async function reviewAttempt(userId: number, attemptId: number) {
  const r = await orNull(call<RawReview>('review_attempt', { attemptid: attemptId, userid: userId }))
  return r ? review(r) : null
}

// ----- school exams (no course) -----

/** The school's exam space (a hidden course holding its exams); created on first use. */
export const examSpace = (userId: number, companyId: number) =>
  call<{ courseid: number }>('exam_space', { companyid: companyId, userid: userId }).then((r) => r.courseid)

export async function examAudience(userId: number, companyId: number, quizId: number): Promise<ExamTaker[]> {
  const rows = await call<Array<{ id: number; name: string; email: string; picture: number; member: boolean; pending: boolean }>>('exam_audience', {
    companyid: companyId,
    userid: userId,
    cmid: quizId,
  })
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email, pictureId: r.picture || null, member: r.member, pending: r.pending }))
}

/** Give the exam to / take it from people. Returns who was newly added. */
export const setExamAudience = (userId: number, companyId: number, quizId: number, add: number[], remove: number[]) =>
  call<{ added: number[] }>('set_exam_audience', { companyid: companyId, userid: userId, cmid: quizId, add, remove }).then((r) => r.added)

// ----- reminders / scheduled publishing -----

/** Quizzes whose scheduled publish time is in (from, to] — to announce them. */
export async function openingNow(from: number, to: number) {
  return call<Array<{ cmid: number; courseid: number; coursename: string; name: string; kind: QuizKind; timeclose: number; students: Array<{ id: number; name: string; email: string }> }>>(
    'opening_now',
    { from, to },
  ).then((rows) => rows.map(({ timeclose, ...r }) => ({ ...r, publishAt: timeclose })))
}


export async function closingSoon(from: number, to: number) {
  return call<
    Array<{ cmid: number; courseid: number; coursename: string; name: string; kind: QuizKind; timeclose: number; students: Array<{ id: number; name: string; email: string }> }>
  >('closing_soon', { from, to })
}
