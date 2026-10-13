/**
 * Level 1 — Listening practice pool.
 * SHAPE:     ListeningPassage with IELTS-style multi-section recording, MCQ + fill-blank + matching.
 * COMPLEXITY: ~300 words, 4 sections, 5 questions mixing MCQ, fill-in-the-blank, and matching.
 * REFERENCE:  Karani's "Listening Test 1 & 2" PDF.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 * NOTE:      Question count normalised to 5 per passage in Phase 10a.
 */
import type { ListeningPassage } from '@/types/platform'

export const LEVEL_1_LISTENING: ListeningPassage[] = [
  {
    id: 'l-l1-001',
    title: 'Workplace Health and Safety Briefing',
    level: 'level-1',
    type: 'talk',
    passage: `Good morning, everyone. Thank you for attending this health and safety briefing. As you know, our company has recently updated its workplace health and safety policy, and it is important that all staff are aware of the key changes.\n\nFirstly, fire evacuation procedures. In the event of a fire alarm, all employees must leave the building immediately using the nearest fire exit. Do not use the lifts. Assemble at the designated meeting point in the rear car park. Fire wardens — identifiable by their orange high-visibility vests — will conduct a roll call. Please do not re-enter the building until a fire warden confirms it is safe to do so.\n\nSecondly, first aid. We have increased the number of trained first aiders on each floor from two to three. A list of first aiders and their locations is displayed on the noticeboard in each department. All first aid kits have been restocked and are located in the kitchen area on each floor.\n\nThirdly, mental health support. The company has partnered with Wellbeing Plus to offer a confidential counselling service available to all employees. You can access this service by calling the freephone number on the poster in the staff room, or by booking through the company intranet. Up to six sessions per year are provided free of charge.\n\nFinally, a reminder about reporting. If you witness a hazard, an accident, or a near-miss, please report it immediately using the online incident form. Do not assume someone else has already reported it. Your report helps us keep the workplace safe for everyone.\n\nThank you for your attention. Are there any questions?`,
    questions: [
      {
        id: 'l-l1-001_q1',
        type: 'mcq',
        question: 'Where should employees assemble during a fire evacuation?',
        options: ['In the kitchen area', 'In the rear car park', 'On the ground floor', 'At the front entrance'],
        correctAnswer: 'In the rear car park',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l-l1-001_q2',
        type: 'mcq',
        question: 'How can fire wardens be identified?',
        options: ['By their name badges', 'By their yellow hats', 'By their orange high-visibility vests', 'By their blue lanyards'],
        correctAnswer: 'By their orange high-visibility vests',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l-l1-001_q3',
        type: 'open',
        question: 'How many trained first aiders are now on each floor?',
        correctAnswer: 'There are now three trained first aiders on each floor.',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l-l1-001_q4',
        type: 'open',
        question: 'Name two ways employees can access the counselling service.',
        correctAnswer: 'Employees can call the freephone number on the poster in the staff room, or they can book through the company intranet.',
        marks: 2,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l-l1-001_q5',
        type: 'open',
        question: 'How many free counselling sessions are available per year?',
        correctAnswer: 'Up to six sessions per year are provided free of charge.',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
    ],
  },
]
