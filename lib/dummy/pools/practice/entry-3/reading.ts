/**
 * Entry Level 3 — Reading practice pool.
 * SHAPE:     ReadingPassage with single-page passage, mix of locate/retrieve + basic inference questions.
 * COMPLEXITY: ~150 words, discourse markers (however, despite), 5 questions including inference.
 * REFERENCE:  Karani's entry assessment PDF Section A advanced questions.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 * NOTE:      Question count normalised to 5 per passage in Phase 10a.
 */
import type { ReadingPassage } from '@/types/platform'

export const ENTRY_3_READING: ReadingPassage[] = [
  {
    id: 'r-e3-001',
    title: 'Local Library Under Threat',
    level: 'entry-3',
    type: 'article',
    text: `Greenfield Library has been at the heart of the community for over forty years. However, the local council announced last week that it may be forced to close the library due to budget cuts. The library currently serves more than two thousand residents each month, offering free internet access, children\'s reading groups, and a popular homework club.\n\nDespite these services, the council argues that the building needs expensive repairs and that fewer people are borrowing physical books than in previous years. Local campaigners disagree. They say the library is more important than ever, especially for elderly residents who rely on it as a social space. A petition to save the library has already gathered over one thousand five hundred signatures.`,
    questions: [
      {
        id: 'r-e3-001_q1',
        type: 'open',
        question: 'How long has Greenfield Library been serving the community?',
        correctAnswer: 'Over forty years',
      },
      {
        id: 'r-e3-001_q2',
        type: 'mcq',
        question: 'What is one reason the council gives for closing the library?',
        options: ['It is too small', 'Budget cuts', 'Lack of books', 'Staff shortages'],
        correctAnswer: 'Budget cuts',
      },
      {
        id: 'r-e3-001_q3',
        type: 'open',
        question: 'Why do the campaigners believe the library is "more important than ever"?',
        correctAnswer: 'Because elderly residents rely on it as a social space',
      },
      {
        id: 'r-e3-001_q4',
        type: 'mcq',
        question: 'What service does the library NOT offer, according to the text?',
        options: ['Free internet access', 'Children\'s reading groups', 'A cafe', 'A popular homework club'],
        correctAnswer: 'A cafe',
      },
      {
        id: 'r-e3-001_q5',
        type: 'open',
        question: 'How many signatures has the petition to save the library gathered?',
        correctAnswer: 'Over one thousand five hundred',
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "r-e3-002",
    title: "Health Clinic Reminder",
    level: "entry-3",
    type: "email",
    text: "Health Clinic Reminder\n\nThe information on the local clinic explains a change that affects students and staff. People should check appointment desk because they may need to confirm a blood test appointment. The deadline or key time is 24 hours before arrival. This matters because it will help everyone bring the appointment letter. The notice also says that people should keep a record of any forms, emails, or reference numbers in case they need to ask a follow-up question later.",
    questions: [
      {
        id: "r-e3-002_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "Health Clinic Reminder",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "Health Clinic Reminder",
      },
      {
        id: "r-e3-002_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "appointment desk",
      },
      {
        id: "r-e3-002_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "confirm a blood test appointment",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "confirm a blood test appointment",
      },
      {
        id: "r-e3-002_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "24 hours before arrival",
      },
      {
        id: "r-e3-002_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "bring the appointment letter",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "bring the appointment letter",
      },
    ],
  },
  {
    id: "r-e3-003",
    title: "Bank Account Notice",
    level: "entry-3",
    type: "advert",
    text: "Bank Account Notice\n\nThe information on the bank branch explains a change that affects students and staff. People should check customer waiting area because they may need to update personal contact details. The deadline or key time is before the end of the month. This matters because it will help everyone avoid account restrictions. The notice also says that people should keep a record of any forms, emails, or reference numbers in case they need to ask a follow-up question later.",
    questions: [
      {
        id: "r-e3-003_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "Bank Account Notice",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "Bank Account Notice",
      },
      {
        id: "r-e3-003_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "customer waiting area",
      },
      {
        id: "r-e3-003_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "update personal contact details",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "update personal contact details",
      },
      {
        id: "r-e3-003_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "before the end of the month",
      },
      {
        id: "r-e3-003_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "avoid account restrictions",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "avoid account restrictions",
      },
    ],
  },
  {
    id: "r-e3-004",
    title: "Course Feedback Survey",
    level: "entry-3",
    type: "report",
    text: "Course Feedback Survey\n\nThe information on the online learning portal explains a change that affects students and staff. People should check student dashboard because they may need to complete a course feedback survey. The deadline or key time is 10 minutes. This matters because it will help everyone help improve future lessons. The notice also says that people should keep a record of any forms, emails, or reference numbers in case they need to ask a follow-up question later.",
    questions: [
      {
        id: "r-e3-004_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "Course Feedback Survey",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "Course Feedback Survey",
      },
      {
        id: "r-e3-004_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "student dashboard",
      },
      {
        id: "r-e3-004_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "complete a course feedback survey",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "complete a course feedback survey",
      },
      {
        id: "r-e3-004_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "10 minutes",
      },
      {
        id: "r-e3-004_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "help improve future lessons",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "help improve future lessons",
      },
    ],
  },
]
