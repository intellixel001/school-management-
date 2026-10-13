/**
 * Entry Level 2 — Reading practice pool.
 * SHAPE:     ReadingPassage with 3–5 sentence paragraph, 5 basic comprehension questions.
 * COMPLEXITY: Short paragraph on familiar topic, locate/retrieve + simple understanding.
 * REFERENCE:  Karani's entry assessment PDF Section A mid-level questions.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 * NOTE:      Question count normalised to 5 per passage in Phase 10a.
 */
import type { ReadingPassage } from '@/types/platform'

export const ENTRY_2_READING: ReadingPassage[] = [
  {
    id: 'r-e2-001',
    title: 'Healthy Eating',
    level: 'entry-2',
    type: 'article',
    text: 'Eating fruit and vegetables every day is very important for your health. Doctors say you should try to eat five portions a day. A portion could be an apple, a handful of grapes, or some carrots. Many people do not eat enough fruit and vegetables because they think it is too expensive.',
    questions: [
      {
        id: 'r-e2-001_q1',
        type: 'mcq',
        question: 'How many portions of fruit and vegetables should you eat each day?',
        options: ['Two', 'Three', 'Four', 'Five'],
        correctAnswer: 'Five',
      },
      {
        id: 'r-e2-001_q2',
        type: 'mcq',
        question: 'Which of the following is mentioned as a portion of fruit or vegetables?',
        options: ['A banana', 'An apple', 'A potato', 'A slice of bread'],
        correctAnswer: 'An apple',
      },
      {
        id: 'r-e2-001_q3',
        type: 'mcq',
        question: 'Why do some people not eat enough fruit and vegetables?',
        options: ['They are too expensive', 'They don\'t like the taste', 'They are hard to cook', 'They forget to buy them'],
        correctAnswer: 'They are too expensive',
      },
      {
        id: 'r-e2-001_q4',
        type: 'mcq',
        question: 'Why is eating fruit and vegetables described as "very important"?',
        options: ['For your teeth', 'For your health', 'For your energy', 'For your skin'],
        correctAnswer: 'For your health',
      },
      {
        id: 'r-e2-001_q5',
        type: 'mcq',
        question: 'Who says you should eat five portions a day?',
        options: ['Teachers', 'Parents', 'Doctors', 'Farmers'],
        correctAnswer: 'Doctors',
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "r-e2-002",
    title: "Community Centre Course",
    level: "entry-2",
    type: "email",
    text: "Community Centre Course\n\nA notice has been placed at the community centre. It tells students to go to main hall and register for a computer class. The important time is next Tuesday. Students should read the notice carefully because they need to bring photo ID. Anyone who is unsure should ask at reception before leaving the building.",
    questions: [
      {
        id: "r-e2-002_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "Community Centre Course",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "Community Centre Course",
      },
      {
        id: "r-e2-002_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "main hall",
      },
      {
        id: "r-e2-002_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "register for a computer class",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "register for a computer class",
      },
      {
        id: "r-e2-002_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "next Tuesday",
      },
      {
        id: "r-e2-002_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "bring photo ID",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "bring photo ID",
      },
    ],
  },
  {
    id: "r-e2-003",
    title: "Part-Time Job Notice",
    level: "entry-2",
    type: "advert",
    text: "Part-Time Job Notice\n\nA notice has been placed at the supermarket. It tells students to go to customer service desk and apply for weekend work. The important time is Friday afternoon. Students should read the notice carefully because they need to complete an online form. Anyone who is unsure should ask at reception before leaving the building.",
    questions: [
      {
        id: "r-e2-003_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "Part-Time Job Notice",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "Part-Time Job Notice",
      },
      {
        id: "r-e2-003_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "customer service desk",
      },
      {
        id: "r-e2-003_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "apply for weekend work",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "apply for weekend work",
      },
      {
        id: "r-e2-003_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "Friday afternoon",
      },
      {
        id: "r-e2-003_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "complete an online form",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "complete an online form",
      },
    ],
  },
  {
    id: "r-e2-004",
    title: "Train Journey Update",
    level: "entry-2",
    type: "report",
    text: "Train Journey Update\n\nA notice has been placed at the train station. It tells students to go to Platform 2 and take the slower train. The important time is 18 minutes later. Students should read the notice carefully because they need to keep the same ticket. Anyone who is unsure should ask at reception before leaving the building.",
    questions: [
      {
        id: "r-e2-004_q1",
        type: "mcq",
        question: "What is the text mainly about?",
        options: [
          "Train Journey Update",
          "A sports result",
          "A holiday story",
          "A recipe",
        ],
        correctAnswer: "Train Journey Update",
      },
      {
        id: "r-e2-004_q2",
        type: "open",
        question: "Where should the reader look or go?",
        correctAnswer: "Platform 2",
      },
      {
        id: "r-e2-004_q3",
        type: "mcq",
        question: "What action is needed?",
        options: [
          "take the slower train",
          "cancel the lesson",
          "buy a new uniform",
          "phone a friend",
        ],
        correctAnswer: "take the slower train",
      },
      {
        id: "r-e2-004_q4",
        type: "open",
        question: "What time, day, or deadline is mentioned?",
        correctAnswer: "18 minutes later",
      },
      {
        id: "r-e2-004_q5",
        type: "mcq",
        question: "What is the expected result or next step?",
        options: [
          "keep the same ticket",
          "miss the appointment",
          "throw away the notice",
          "start a new course immediately",
        ],
        correctAnswer: "keep the same ticket",
      },
    ],
  },
]
