import type { Session } from '@/types/platform'

// Session.duration is stored in SECONDS (matches kiosk's createPracticeSession writes).
// Display code converts to minutes via Math.round(duration / 60).
// Phase 3 migrated this from minutes → seconds for unit consistency.
export const DUMMY_SESSIONS: Session[] = [
  {
    id: 'ses-001', studentId: 'stu-001', date: '2026-05-12T14:00:00Z',
    duration: 1500, skillArea: 'speaking', score: 82,
    questionsAttempted: 6, questionsCorrect: 5,
    teacherFeedback: 'Great fluency improvement. Work on complex conditionals.',
    status: 'completed', source: 'practice',
  },
  {
    id: 'ses-002', studentId: 'stu-002', date: '2026-05-11T10:00:00Z',
    duration: 1200, skillArea: 'reading', score: 60,
    questionsAttempted: 8, questionsCorrect: 5,
    teacherFeedback: null, status: 'completed', source: 'quiz',
  },
  {
    id: 'ses-003', studentId: 'stu-003', date: '2026-04-28T09:00:00Z',
    duration: 900, skillArea: 'listening', score: 45,
    questionsAttempted: 5, questionsCorrect: 2,
    teacherFeedback: 'Needs more practice with fast speech. Schedule extra listening session.',
    status: 'completed', source: 'practice',
  },
  {
    id: 'ses-004', studentId: 'stu-004', date: '2026-05-12T08:00:00Z',
    duration: 1800, skillArea: 'writing', score: 85,
    questionsAttempted: 4, questionsCorrect: 4,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-005', studentId: 'stu-001', date: '2026-05-10T11:00:00Z',
    duration: 1320, skillArea: 'listening', score: 74,
    questionsAttempted: 7, questionsCorrect: 5,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-006', studentId: 'stu-006', date: '2026-05-10T11:30:00Z',
    duration: 1080, skillArea: 'speaking', score: 64,
    questionsAttempted: 5, questionsCorrect: 3,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-007', studentId: 'stu-007', date: '2026-05-08T13:00:00Z',
    duration: 1200, skillArea: 'reading', score: 62,
    questionsAttempted: 8, questionsCorrect: 5,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-008', studentId: 'stu-009', date: '2026-05-12T15:45:00Z',
    duration: 2100, skillArea: 'writing', score: 88,
    questionsAttempted: 5, questionsCorrect: 5,
    teacherFeedback: 'Excellent paragraph cohesion. Ready to attempt L3 material.',
    status: 'completed', source: 'practice',
  },
  {
    id: 'ses-009', studentId: 'stu-005', date: '2026-03-15T16:00:00Z',
    duration: 600, skillArea: 'speaking', score: 40,
    questionsAttempted: 3, questionsCorrect: 1,
    teacherFeedback: null, status: 'abandoned', source: 'quiz',
  },
  {
    id: 'ses-010', studentId: 'stu-012', date: '2026-05-12T12:00:00Z',
    duration: 1680, skillArea: 'listening', score: 93,
    questionsAttempted: 10, questionsCorrect: 9,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-011', studentId: 'stu-002', date: '2026-05-09T09:30:00Z',
    duration: 1200, skillArea: 'writing', score: 52,
    questionsAttempted: 4, questionsCorrect: 2,
    teacherFeedback: 'Review paragraph structure and topic sentences.',
    status: 'completed', source: 'practice',
  },
  {
    id: 'ses-012', studentId: 'stu-008', date: '2026-05-01T10:00:00Z',
    duration: 900, skillArea: 'reading', score: 35,
    questionsAttempted: 6, questionsCorrect: 2,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-013', studentId: 'stu-011', date: '2026-05-11T14:00:00Z',
    duration: 1080, skillArea: 'speaking', score: 48,
    questionsAttempted: 5, questionsCorrect: 2,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-014', studentId: 'stu-004', date: '2026-05-10T09:00:00Z',
    duration: 1500, skillArea: 'reading', score: 90,
    questionsAttempted: 10, questionsCorrect: 9,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-015', studentId: 'stu-001', date: '2026-05-08T14:00:00Z',
    duration: 0, skillArea: 'writing', score: 0,
    questionsAttempted: 0, questionsCorrect: 0,
    teacherFeedback: null, status: 'in-progress', source: 'quiz',
  },
  {
    id: 'ses-016', studentId: 'stu-006', date: '2026-05-08T10:00:00Z',
    duration: 1200, skillArea: 'writing', score: 77,
    questionsAttempted: 4, questionsCorrect: 3,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-017', studentId: 'stu-003', date: '2026-04-20T11:00:00Z',
    duration: 720, skillArea: 'reading', score: 38,
    questionsAttempted: 5, questionsCorrect: 2,
    teacherFeedback: null, status: 'abandoned', source: 'practice',
  },
  {
    id: 'ses-018', studentId: 'stu-009', date: '2026-05-09T10:00:00Z',
    duration: 1800, skillArea: 'speaking', score: 91,
    questionsAttempted: 6, questionsCorrect: 6,
    teacherFeedback: 'Outstanding delivery. Natural intonation throughout.',
    status: 'completed', source: 'practice',
  },
  {
    id: 'ses-019', studentId: 'stu-012', date: '2026-05-11T09:00:00Z',
    duration: 1800, skillArea: 'writing', score: 88,
    questionsAttempted: 5, questionsCorrect: 5,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
  {
    id: 'ses-020', studentId: 'stu-007', date: '2026-05-06T15:00:00Z',
    duration: 1320, skillArea: 'listening', score: 67,
    questionsAttempted: 6, questionsCorrect: 4,
    teacherFeedback: null, status: 'completed', source: 'practice',
  },
]
