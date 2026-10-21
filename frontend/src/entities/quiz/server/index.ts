import 'server-only'
// Server-only public API of the quiz entity.
export {
  courseQuizzes,
  saveQuiz,
  getQuiz,
  publishQuiz,
  deleteQuiz,
  saveQuestion,
  moveQuestion,
  quizResults,
  teacherReview,
  gradeAnswer,
  myQuizzes,
  quizForStudent,
  startAttempt,
  getAttempt,
  saveAttempt,
  reviewAttempt,
  closingSoon,
  openingNow,
  type QuizSettings,
} from './quizzes'
