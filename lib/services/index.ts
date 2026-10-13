// ── Service Layer — Single Entry Point ────────────────────────────────────────
// All consumers import from '@/lib/services' — never from individual service files.
// This makes future module reorganisation transparent to the rest of the codebase.

export {
  getStudents,
  getStudentById,
  getStudentByPin,
  authenticateStudent,
  authenticateStudentByPin,
  getStudentByEmail,
  addPointsToStudent,
  getStudentStats,
  getPendingStudents,
  approveStudent,
  rejectStudent,
  updateStudentLevel,

  // Registration flow
  requestRegistrationOTP,
  verifyRegistrationOTP,
  completeRegistration,
} from './students'
export type { StudentStats } from './students'

export {
  getSessionsByStudentId,
  getAllSessions,
  getRecentSessions,
  recordPracticeResult,
  recordQuizResult,
  getPendingPracticeFeedback,
  getSessionById,
  getSessionByIdFor,
  submitPracticeFeedback,
  generatePracticeSessionOverview,
} from './sessions'
export type {
  PracticeResultInput,
  PracticeResultOutput,
  QuizResultInput,
  QuizResultOutput,
} from './sessions'

export { getTeacher, authenticateTeacher } from './teacher'

export {
  logoutApi,
  getCurrentUserApi,
  loginStudentByPasswordApi,
} from './auth'
export type { MeResponse } from './auth'

export { getReviewHistory } from './reviewHistory'
export type { ReviewHistoryItem, ReviewSource, ReviewHistoryFilters } from './reviewHistory'

export { getQuestionsBySkill, getQuestionsForQuiz } from './questions'

export { ServiceError } from './errors'
export type { ServiceErrorCode } from './errors'

// ── Practice Pool Services ─────────────────────────────────────────────────
export {
  getPracticeReadingForLevel,
  getPracticeWritingForLevel,
  getPracticeSpeakingForLevel,
  getPracticeListeningForLevel,
  getRandomPracticePassage,
  getRandomPracticePrompt,
  getRandomWritingPrompt,
  getRandomSpeakingTopic,
} from './pools'

// ── Mock Paper & Attempt Services ─────────────────────────────────────────
export {
  getMockExams,
  getMockExam,
  getStudentMockAttempts,
  getMockSectionAttempt,
  createMockSectionAttempt,
  submitMockSectionAttempt,
  publishMockSectionAttempt,
  getPendingMockReviews,
  getMockReviewDetail,
  setReattemptAllowed,
  computeSectionScorePercent,
} from './mocks'
export type { MockReviewDetail } from './mocks'

// ── AI Tutor & Student Insight ─────────────────────────────────────────────
export {
  sendTutorMessage,
  getStudentInsight,
} from './tutor'
export type {
  TutorChatInput,
  TutorChatResponse,
  ConversationTurn,
  StudentInsightResponse,
} from './tutor'

// ── GDPR ───────────────────────────────────────────────────────────────────
export {
  gdprExport,
  gdprDelete,
} from './gdpr'
export type { GdprExportData } from './gdpr'
