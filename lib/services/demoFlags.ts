// ⚠️  TEMPORARY — DEMO / SCREENSHOT MODE flags
//
// Each flag forces a specific area of the app to use dummy data regardless of
// USE_REAL_API. Individually toggleable so we can demo one area without
// breaking the rest (e.g. show populated teacher dashboard while keeping real
// login and student portal against the Django backend).
//
// Flip to `false` to restore the real backend for that area.
//
// Related flags that live in their own files:
//   - `MOCK_MOCKS_FOR_DEMO`    → lib/services/mocks.ts    (mock exams)
//   - `MOCK_REGISTER_FOR_DEMO` → lib/services/students.ts (student register OTP flow)

/**
 * When true, teacher-scoped reads (getTeacher, getStudents, getAllSessions,
 * getPendingStudents, getPendingPracticeFeedback) return dummy data.
 *
 * Teacher portal will show populated cohort skill health, recent activity, etc.
 * Student portal is unaffected — it uses different service functions.
 */
export const MOCK_TEACHER_FOR_DEMO = false
