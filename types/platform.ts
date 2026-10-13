// ─── Platform Entity Types ─────────────────────────────────────────────────

export type SkillArea = 'reading' | 'writing' | 'speaking' | 'listening'

/**
 * Four placement levels used by NCL's Pre-sessional programme.
 * Set by the teacher after the paper-based entry assessment.
 *   entry-1 = simplest ("Tom has a blue car.")
 *   level-1 = full IELTS-style content (target: IELTS Writing 5.5)
 */
export type SkillLevel = 'entry-1' | 'entry-2' | 'entry-3' | 'level-1'

export type Portal = 'kiosk' | 'student' | 'teacher'

export type SessionStatus = 'completed' | 'in-progress' | 'abandoned'

export type StudentStatus = 'active' | 'inactive' | 'needs-attention' | 'pending' | 'rejected'


export type QuestionType = 'mcq' | 'fill-blank' | 'true-false' | 'spoken'

export interface SkillScores {
  reading: number
  writing: number
  speaking: number
  listening: number
}

export interface Student {
  id: string
  name: string
  pin: string
  /** Set by the teacher after marking the paper entry assessment. */
  level: SkillLevel
  enrolledDate: string
  lastActive: string
  skills: SkillScores
  completedSessions: number
  streak: number
  status: StudentStatus
  ilpTargets: string[]

  /**
   * Student's email — used as login identifier. Any valid email domain accepted.
   * Format-validated by `isValidEmail` in the service layer; must be unique.
   */
  email: string

  /**
   * Total points earned across all practice sessions + quizzes.
   * 1 point per correct answer/task. Updated atomically server-side via `addPointsToStudent`.
   * Starts at 0 for newly enrolled students.
   */
  totalPoints: number
}

export type SessionSource = 'practice' | 'quiz'

export interface Session {
  id: string
  studentId: string
  date: string
  duration: number
  skillArea: SkillArea
  score: number
  questionsAttempted: number
  questionsCorrect: number
  teacherFeedback: string | null
  status: SessionStatus
  /** Discriminates kiosk practice vs web quiz. Required field. */
  source: SessionSource

  /**
   * AI-generated short overview of this session (≤30 words).
   * Auto-populated when the session is created via recordPracticeResult.
   * Used by the teacher's practice-feedback detail page to give Karani
   * instant context before she writes per-session feedback.
   *
   * Null when AI generation failed at submit time — the teacher detail
   * page shows a "Generate overview" button to lazily regenerate.
   */
  aiOverview?: string | null

  /** ISO timestamp when aiOverview was last generated. Null if never generated. */
  aiOverviewGeneratedAt?: string | null
}

export interface Question {
  id: string
  skillArea: SkillArea
  level: SkillLevel
  type: QuestionType
  questionText: string
  options: string[] | null
  correctAnswer: string
  topic: string
  vocabulary: string[]
}

/**
 * Quick Quiz question as served to the client — deliberately has NO
 * `correctAnswer` field. Grading happens server-side (see lib/services/quiz.ts)
 * so the answer key is never exposed in the network response or JS bundle.
 */
export interface QuizQuestion {
  id: string
  questionText: string
  options: string[]
}

export interface Teacher {
  id: string
  name: string
  email: string
  avatar: string
  assignedStudents: string[]
  pendingReviews: number
}

// ─── Content Pool Types ─────────────────────────────────────────────────────
// Passage-grouped content for AI tutoring sessions.
// These are additive — the atomic Question type above stays intact for quiz/practice.

export type ReadingQuestionType = 'mcq' | 'open'

export interface ReadingQuestion {
  id: string
  type: ReadingQuestionType
  question: string
  options?: string[]
  correctAnswer?: string
  marks?: number
  criterion?: string
}

/**
 * A Reading practice session. Holds exactly 5 questions.
 * Student earns 1 point per correct answer, 5 max.
 */
export interface ReadingPassage {
  id: string
  title: string
  level: SkillLevel
  type: 'article' | 'letter' | 'email' | 'advert' | 'report' | 'web_page'
  text: string
  questions: ReadingQuestion[]
}

export type WritingTaskType = 'formal_letter' | 'email' | 'article' | 'report' | 'review'

/**
 * A single atomic writing task within a WritingPrompt session.
 * Student writes 2–3 sentences in response. AI awards 1 point if the response
 * meets the task's criteria, else 0.
 */
export interface WritingTask {
  id: string
  /** What the student should write — e.g., "Write 2 sentences about your favourite season." */
  instruction: string
  /** Minimum word count for a valid attempt (default 10 if absent). */
  minWords?: number
  /** Optional hint shown after a failed attempt. */
  hint?: string
}

/**
 * A Writing practice session. Holds exactly 5 atomic tasks (`WritingTask`).
 * Student completes all 5 to finish the session. Earns 0–5 points total.
 *
 * Legacy fields (`prompt`, `audience`, `purpose`, `wordCountGuidance`, `criteria`)
 * are preserved for backward compatibility with existing session pages.
 * They will be retired when session UIs are redesigned to consume `tasks`.
 */
export interface WritingPrompt {
  id: string
  title: string
  level: SkillLevel
  type: WritingTaskType
  /** @deprecated Phase 10a — use `tasks` array instead. Kept for existing session pages. */
  prompt: string
  /** @deprecated Phase 10a — use `tasks` array instead. */
  audience: string
  /** @deprecated Phase 10a — use `tasks` array instead. */
  purpose: string
  /** @deprecated Phase 10a — use `tasks` array instead. */
  wordCountGuidance: string
  /** @deprecated Phase 10a — use `tasks` array instead. */
  criteria: string[]
  /**
   * Atomic tasks for the points-based practice flow (Phase 10a+).
   * Practice prompts always have exactly 5 tasks. Mock paper prompts may omit this.
   * @since Phase 10a
   */
  tasks?: WritingTask[]
}

export type SpeakingFormat = 'discussion' | 'presentation'

/**
 * A single atomic speaking task within a SpeakingTopic session.
 * Student speaks for ~20–40 seconds in response. AI awards 1 point if the
 * response meets the task's criteria, else 0.
 */
export interface SpeakingTask {
  id: string
  /** What the student should say — e.g., "Describe your hometown in 2 sentences." */
  instruction: string
  /** Expected speaking duration in seconds (default 30 if absent). */
  expectedDurationSec?: number
  /** Optional hint shown after a failed attempt. */
  hint?: string
}

/**
 * A Speaking practice session. Holds exactly 5 atomic tasks (`SpeakingTask`).
 *
 * Legacy fields (`scenario`, `openingPrompt`, `followUpPrompts`, `assessmentFocus`)
 * are preserved for backward compatibility with existing session pages and prompts.
 * They will be retired when session UIs are redesigned to consume `tasks`.
 */
export interface SpeakingTopic {
  id: string
  title: string
  level: SkillLevel
  /** @deprecated Phase 10a — use `tasks` array instead. Kept for existing session pages. */
  format: SpeakingFormat
  /** @deprecated Phase 10a — use `tasks` array instead. */
  scenario: string
  /** @deprecated Phase 10a — use `tasks` array instead. */
  openingPrompt: string
  /** @deprecated Phase 10a — use `tasks` array instead. */
  followUpPrompts: string[]
  /** @deprecated Phase 10a — use `tasks` array instead. */
  assessmentFocus: string[]
  /**
   * Atomic tasks for the points-based practice flow (Phase 10a+).
   * Practice topics always have exactly 5 tasks. Mock paper topics may omit this.
   * @since Phase 10a
   */
  tasks?: SpeakingTask[]
}

export type ListeningTextType = 'announcement' | 'talk' | 'conversation' | 'news_report'

export type ListeningQuestionType = 'mcq' | 'open'

export interface ListeningQuestion {
  id: string
  type: ListeningQuestionType
  question: string
  options?: string[]
  correctAnswer?: string
  marks?: number
  criterion?: string
}

/**
 * A Listening practice session. Holds exactly 5 structured questions.
 * Student earns 1 point per correct answer, 5 max.
 * AI evaluates each submitted answer and returns { isCorrect: boolean }.
 */
export interface ListeningPassage {
  id: string
  title: string
  level: SkillLevel
  type: ListeningTextType
  passage: string
  questions: ListeningQuestion[]
}

// ─── Mock Paper Types ───────────────────────────────────────────────────────
// Per Karani: 5 integrated mock papers per level, spanning all 4 skills.
// Phase 3 ships 1 populated + 4 stubs per level. Phase 6 adds scoring API.

// ─── Mock Exam Track (Mock-phase-1) ────────────────────────────────────────
// New separated-session architecture. Coexists with legacy MockPaper for now;
// legacy removed in Mock-phase-6 once all UI migrates to these types.

export type MockExamStatus = 'active' | 'locked'

/**
 * A complete mock exam bundle. Contains 3 independent skill sections.
 * Students take each section as a separate session.
 */
export interface MockExam {
  id: string                              // 'mock-1' ... 'mock-5'
  number: 1 | 2 | 3 | 4 | 5
  title: string                           // 'Mock Test 1'
  status: MockExamStatus                  // 'locked' = visible-but-disabled in picker
  reading: MockReadingTest | null         // null when locked
  listening: MockListeningTest | null
  writing: MockWritingTest | null
}

export type MockReadingQuestionType = 'true-false-not-given' | 'short-answer'

export interface MockReadingQuestion {
  id: string
  type: MockReadingQuestionType
  question: string                        // The statement (T/F/NG) or question (short-answer)
  /**
   * For T/F/NG: one of 'TRUE' | 'FALSE' | 'NOT GIVEN'
   * For short-answer: the expected answer text (auto-grader uses
   *   case-insensitive trim + word-count check)
   */
  correctAnswer: string
  /**
   * Short-answer only. Karani's papers say "NO MORE THAN THREE WORDS" — so 3.
   * Auto-grader marks wrong if studentAnswer exceeds this word count.
   */
  maxWords?: number
}

export interface MockReadingTest {
  id: string                              // 'mock-1-reading'
  passageTitle: string                    // 'The Concept of Childhood in Western Countries'
  passageText: string                     // ~750 words academic prose
  questions: MockReadingQuestion[]        // EXACTLY 13
  durationMinutes: number                 // 30
}

export type MockListeningQuestionType =
  | 'notes-form-fill'      // Section 1 style — form layout with labelled blanks
  | 'mcq-single'           // A/B/C standard MCQ
  | 'mcq-multi'            // "Choose TWO letters A-E" multi-select
  | 'matching'             // Match A-I features to numbered items
  | 'notes-bullet-fill'    // Section 4 style — bullet list with blanks under headings

/**
 * Defines a notes/form layout that contains fill-in blanks. Used by
 * notes-form-fill and notes-bullet-fill question types.
 * Each blank references a question by id, so the renderer can interleave
 * static labels with input fields.
 */
export interface MockListeningFormContext {
  id: string                              // 'transport-survey'
  title: string                           // 'Transport Survey'
  format: 'form' | 'bullet-list'
  /**
   * Display elements in order. The renderer walks these top-to-bottom.
   * Labels are static text (including the surrounding context for each blank).
   * Blanks resolve to the question with matching questionId, which provides
   * the surrounding line context if any.
   */
  elements: Array<
    | { type: 'heading'; text: string }
    | { type: 'label'; text: string }
    | { type: 'blank'; questionId: string }
  >
}

export interface MockListeningQuestion {
  id: string
  type: MockListeningQuestionType

  /** Display question text. Empty for blanks inside a form context. */
  question: string

  /**
   * Which recording this question belongs to. Used for section grouping and
   * display-number computation. When present, this is the authoritative link
   * to a recording (preferred over regex-parsing the id).
   */
  recordingId?: string

  /**
   * If this question is a blank inside a form/notes context, the context id.
   * The renderer fetches the context and renders the question inline.
   */
  formContextId?: string

  /** Hint label for fill-blank (e.g., 'Postcode:'). Optional UI affordance. */
  label?: string

  /** For MCQ single + multi: option strings (e.g., ['local people', 'the City Council', ...]). */
  options?: string[]

  /** For mcq-multi: how many to select (e.g., 2 for "Choose TWO"). */
  numberToSelect?: number

  /** For matching: the A-I option pool. */
  matchingOptions?: string[]

  /**
   * The correct answer.
   * - single value (string) for mcq-single, notes-form-fill, notes-bullet-fill
   * - array of strings for mcq-multi (set comparison, order-independent)
   * - the matching letter (e.g., 'A') for matching
   */
  correctAnswer: string | string[]

  /** Word limit for fill-blank types. Karani's papers vary: 'ONE WORD AND/OR A NUMBER', 'ONE WORD ONLY'. */
  maxWords?: number
}

export interface MockListeningRecording {
  id: string
  title: string                           // 'Recording 1' / 'Recording 2'
  /**
   * The full text TTS reads aloud during the test. This is what students hear.
   * The questions are answered while/after listening to this.
   * Phase 11 (Django backend) replaces this with a URL to a real recording.
   */
  audioScript: string
  /** Which questions this recording covers (inclusive 1-based). */
  questionRange: { from: number; to: number }
  /** Estimated duration in seconds (used for progress bar). */
  estimatedDurationSec: number
}

export interface MockListeningTest {
  id: string                              // 'mock-1-listening'
  recordings: MockListeningRecording[]    // typically 2 per test
  formContexts: MockListeningFormContext[] // For notes-fill questions
  questions: MockListeningQuestion[]      // EXACTLY 20
  durationMinutes: number                 // 25
}

export interface MockWritingTest {
  id: string                              // 'mock-1-writing'
  taskNumber: 1 | 2                       // Karani uses Task 2 (essay)
  /** The prompt question, e.g., "Does social media negatively impact wellbeing?" */
  prompt: string
  /** Surrounding context paragraph that frames the prompt. */
  promptDescription: string
  /** Specific instruction (e.g., "Give reasons for your answer and include relevant examples"). */
  instructions: string
  minWords: number                        // 250
  durationMinutes: number                 // 40
}

/**
 * IELTS Writing 4-band rubric. Each band 0-9, with .5 increments allowed.
 * Overall = average of 4, rounded to nearest 0.5.
 *
 * Matches Karani's "EXAMINER'S USE ONLY" rubric (TR/CC/LR/GRA).
 */
export interface MockWritingBands {
  taskResponse: number               // TR
  coherenceCohesion: number          // CC
  lexicalResource: number            // LR
  grammaticalRange: number           // GRA
  overallBand: number                // computed from 4 above
}

/**
 * Flags Karani checks on the writing answer sheet. The AI auto-detects
 * underlength (word count) and attempts off-topic / memorised; teacher
 * confirms or overrides during review.
 */
export interface MockWritingFlags {
  underlength: boolean                    // wordCount < minWords (auto)
  offTopic: boolean                       // AI-detected, teacher confirms
  memorised: boolean                      // AI-detected, teacher confirms
}

export interface MockWritingScore {
  bands: MockWritingBands
  flags: MockWritingFlags
  wordCount: number
  /** AI's qualitative feedback. 2-4 sentences. */
  feedback: string
  /** Optional per-band reasoning for transparency. */
  bandReasoning?: {
    taskResponse: string
    coherenceCohesion: string
    lexicalResource: string
    grammaticalRange: string
  }
}

export type MockSectionAttemptStatus =
  | 'in-progress'    // Session active, student answering
  | 'submitted'      // Student finished, awaiting grade (R/L auto-grades instantly; W waits for AI)
  | 'ai-graded'      // Writing only: AI scored, awaiting teacher review
  | 'reviewed'       // Teacher published the final score; visible to student

/**
 * One independent skill-section attempt by a student on a specific mock exam.
 * Reading + Listening + Writing each get their own attempt records.
 */
export interface MockSectionAttempt {
  id: string                              // UUID
  studentId: string
  mockExamId: string                      // 'mock-1'
  skill: 'reading' | 'listening' | 'writing'
  status: MockSectionAttemptStatus

  startedAt: string                       // ISO
  submittedAt: string | null
  reviewedAt: string | null               // when teacher published
  durationSeconds: number                 // wall-clock time student spent

  /**
   * Student's answers. Key = question id.
   * - Single answer: string (e.g., 'TRUE', 'A', '10:00')
   * - Multi-select (mcq-multi): array of strings (e.g., ['B', 'D'])
   * - Writing: { essayText: string } — the long-form response, keyed by 'essay'
   */
  answers: Record<string, string | string[]>

  /**
   * AI-generated per-question feedback. Keyed by questionId.
   * Value is "Correct." for right answers, a short sentence (≤18 words)
   * explaining the mistake for wrong answers.
   *
   * Populated on submit for Reading and Listening sections via the
   * `/api/mock-reading-feedback` and `/api/mock-listening-feedback` endpoints.
   * Null for Writing (writing has its own rich `MockWritingScore`).
   * Null if the AI call failed at submit time.
   */
  aiQuestionFeedback?: Record<string, string> | null

  // ── Auto-grade results (Reading + Listening only; null for Writing) ─────
  rawScore: number | null                 // e.g., 11 (correct count)
  totalQuestions: number                  // 13 for reading, 20 for listening, 1 for writing
  /** IELTS band converted from raw score. Computed at submit time. */
  ieltsBand: number | null

  // ── Writing AI score (Writing only; null for R/L) ──────────────────────
  writingAiScore: MockWritingScore | null

  // ── Teacher final overrides (filled when reviewed; null until then) ────
  /** For R/L: teacher's final mark count (may differ from rawScore if teacher overrode). */
  teacherFinalRawScore: number | null
  teacherFinalBand: number | null         // teacher's final IELTS band
  /** For Writing: teacher's final 4-band overrides + flag confirmations. */
  teacherFinalWritingScore: MockWritingScore | null
  /** Teacher's personalised written feedback to the student. */
  teacherFeedback: string | null

  allowReattempt?: boolean
}

export interface MockQuestionForFeedback {
  questionId: string
  type: string                              // e.g. 'true-false-not-given', 'mcq-single'
  question: string                          // question text or context
  studentAnswer: string | string[] | null   // null = skipped
  correctAnswer: string | string[]
  isCorrect: boolean                        // pre-computed by auto-grader
}

