/**
 * Entry Level 1 — Reading practice pool.
 * SHAPE:     ReadingPassage with 1–2 sentence text, 5 literal-recall questions, 1 mark each.
 * COMPLEXITY: Single simple sentence, everyday vocabulary, yes/no or one-word answer.
 * REFERENCE:  Karani's entry assessment PDF Section A early questions.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 * NOTE:      Question count normalised to 5 per passage in Phase 10a.
 */
import type { ReadingPassage } from '@/types/platform'

export const ENTRY_1_READING: ReadingPassage[] = [
  {
    id: 'r-e1-001',
    title: 'Tom and His Car',
    level: 'entry-1',
    type: 'article',
    text: 'Tom has a blue car. He drives it to work every day. He parks the car next to the shop. At lunch, Tom eats a cheese sandwich. After work, he takes his dog for a walk in the park.',
    questions: [
      {
        id: 'r-e1-001_q1',
        type: 'mcq',
        question: 'What colour is Tom\'s car?',
        options: ['Red', 'Blue', 'Green', 'Black'],
        correctAnswer: 'Blue',
      },
      {
        id: 'r-e1-001_q2',
        type: 'mcq',
        question: 'Where does Tom park his car?',
        options: ['Next to the shop', 'Behind the office', 'In the garage', 'On the street'],
        correctAnswer: 'Next to the shop',
      },
      {
        id: 'r-e1-001_q3',
        type: 'mcq',
        question: 'What does Tom eat at lunch?',
        options: ['A cheese sandwich', 'A salad', 'Chicken soup', 'An apple'],
        correctAnswer: 'A cheese sandwich',
      },
      {
        id: 'r-e1-001_q4',
        type: 'mcq',
        question: 'When does Tom take his dog for a walk?',
        options: ['Before work', 'At lunch', 'After work', 'On weekends'],
        correctAnswer: 'After work',
      },
      {
        id: 'r-e1-001_q5',
        type: 'mcq',
        question: 'Where does Tom walk his dog?',
        options: ['Next to the shop', 'In the park', 'On the beach', 'In the forest'],
        correctAnswer: 'In the park',
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "r-e1-002",
    title: "The College Cafe",
    level: "entry-1",
    type: "email",
    text: "The College Cafe. This text is about a student at the college cafe. The student is at the small table near the window. The student needs to buy a chicken sandwich. The time or day is 1:15. After this, the student will go back to class.",
    questions: [
      {
        id: "r-e1-002_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "The College Cafe",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "The College Cafe",
      },
      {
        id: "r-e1-002_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "the small table near the window",
      },
      {
        id: "r-e1-002_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "buy a chicken sandwich",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "buy a chicken sandwich",
      },
      {
        id: "r-e1-002_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "1:15",
      },
      {
        id: "r-e1-002_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "go back to class",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "go back to class",
      },
    ],
  },
  {
    id: "r-e1-003",
    title: "Mina's Family Photo",
    level: "entry-1",
    type: "advert",
    text: "Mina's Family Photo. This text is about a student at the classroom. The student is at Mina's desk. The student needs to show a family photo. The time or day is Monday morning. After this, the student will write three names.",
    questions: [
      {
        id: "r-e1-003_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "Mina's Family Photo",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "Mina's Family Photo",
      },
      {
        id: "r-e1-003_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "Mina's desk",
      },
      {
        id: "r-e1-003_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "show a family photo",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "show a family photo",
      },
      {
        id: "r-e1-003_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "Monday morning",
      },
      {
        id: "r-e1-003_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "write three names",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "write three names",
      },
    ],
  },
  {
    id: "r-e1-004",
    title: "The Morning Class",
    level: "entry-1",
    type: "report",
    text: "The Morning Class. This text is about a student at the English room. The student is at Room 4. The student needs to read five new words. The time or day is 9:30. After this, the student will finish a short worksheet.",
    questions: [
      {
        id: "r-e1-004_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "The Morning Class",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "The Morning Class",
      },
      {
        id: "r-e1-004_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "Room 4",
      },
      {
        id: "r-e1-004_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "read five new words",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "read five new words",
      },
      {
        id: "r-e1-004_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "9:30",
      },
      {
        id: "r-e1-004_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "finish a short worksheet",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "finish a short worksheet",
      },
    ],
  },
]
