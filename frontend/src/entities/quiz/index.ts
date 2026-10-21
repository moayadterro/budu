// Public API of the quiz entity (quizzes & exams). Server code: '@/entities/quiz/server'.
export { QuizKindBadge, QuizStateBadge } from './ui/QuizBadges'
export { QUESTION_TYPES } from './model/types'
export type {
  QuizKind,
  QuestionType,
  QuestionData,
  Question,
  QuizInfo,
  TeacherQuiz,
  QuizDetail,
  StudentQuiz,
  StudentQuizState,
  Attempt,
  AttemptQuestion,
  AttemptAnswer,
  Review,
  ReviewResult,
  QuizResults,
} from './model/types'
