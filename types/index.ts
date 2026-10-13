export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type SessionMode = 'practice' | 'assessment'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface FeedbackItem {
  icon: string
  text: string
}

export interface AIResponse {
  reply: string
  vocab?: string[]
  feedback?: FeedbackItem[]
  score?: number
  /**
   * Present when the question is closed (T/F, T/F/NG, A/B/C/D, multiple choice).
   * UI renders these as tappable buttons. When the user taps one, the option's
   * string is sent back as their answer. Absent for open-ended questions.
   */
  options?: string[]
}

export interface SessionStats {
  exchanges: number
  duration: number
  score: number
}

export interface LearnerProfile {
  name: string
  level: Level
  streak: number
  totalSessions: number
}

// ─── Content Pool Types (canonical definitions in platform.ts) ───────────────
// New canonical names
export type {
  ReadingQuestionType,
  ReadingQuestion,
  ReadingPassage,
  WritingTaskType,
  WritingTask,
  WritingPrompt,
  SpeakingFormat,
  SpeakingTask,
  SpeakingTopic,
  ListeningTextType,
  ListeningQuestion,
  ListeningPassage,
  MockExam,
  MockExamStatus,
  MockReadingTest,
  MockReadingQuestion,
  MockReadingQuestionType,
  MockListeningTest,
  MockListeningRecording,
  MockListeningFormContext,
  MockListeningQuestion,
  MockListeningQuestionType,
  MockWritingTest,
  MockWritingBands,
  MockWritingFlags,
  MockWritingScore,
  MockSectionAttempt,
  MockSectionAttemptStatus,
  MockQuestionForFeedback,
} from './platform'

