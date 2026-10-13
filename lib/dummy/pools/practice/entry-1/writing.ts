/**
 * Entry Level 1 — Writing practice pool.
 * SHAPE:     WritingPrompt with 2–3 sentence expected output, very familiar topic.
 *            Phase 10a restructured: each prompt contains 5 atomic WritingTask items.
 * COMPLEXITY: Simple personal info; "Write your name, age, and one thing you like."
 * REFERENCE:  Karani's entry assessment PDF Section B Q1 ("about yourself").
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 */
import type { WritingPrompt } from '@/types/platform'

export const ENTRY_1_WRITING: WritingPrompt[] = [
  {
    id: 'w-e1-001',
    title: 'About Yourself',
    level: 'entry-1',
    type: 'email',
    prompt: 'Write two or three sentences about yourself. Say your name, where you are from, and one thing you like to do.',
    audience: 'Your teacher',
    purpose: 'To give basic personal information',
    wordCountGuidance: 'Write 2 to 3 sentences',
    criteria: [
      'Writing your name and basic information clearly',
      'Using capital letters and full stops correctly',
    ],
    tasks: [
      {
        id: 'wt-e1-001-01',
        instruction: 'Write two sentences about yourself. Say your name and how old you are.',
        minWords: 8,
        hint: 'Start with "My name is…" and then "I am … years old."',
      },
      {
        id: 'wt-e1-001-02',
        instruction: 'Write where you are from. Name your country and your city or town.',
        minWords: 8,
      },
      {
        id: 'wt-e1-001-03',
        instruction: 'Write two sentences about your family. How many people are in your family?',
        minWords: 10,
        hint: 'You can say "There are … people in my family." Then name them.',
      },
      {
        id: 'wt-e1-001-04',
        instruction: 'What is your favourite food? Write one or two sentences about it.',
        minWords: 8,
      },
      {
        id: 'wt-e1-001-05',
        instruction: 'Write one thing you like to do in your free time.',
        minWords: 8,
        hint: 'Try "I like to…" or "In my free time I…"',
      },
    ],
  },
  {
    id: 'w-e1-002',
    title: 'Everyday Life',
    level: 'entry-1',
    type: 'article',
    prompt: 'Write two or three sentences about your everyday life. Talk about what you do each day.',
    audience: 'Your teacher',
    purpose: 'To describe simple daily activities',
    wordCountGuidance: 'Write 2 to 3 sentences',
    criteria: [
      'Writing about daily activities in a clear way',
      'Using capital letters and full stops correctly',
    ],
    tasks: [
      {
        id: 'wt-e1-002-01',
        instruction: 'What do you do in the morning? Write two sentences about your morning.',
        minWords: 10,
        hint: 'Say what time you wake up and what you do first.',
      },
      {
        id: 'wt-e1-002-02',
        instruction: 'What is the weather like today? Write one or two sentences.',
        minWords: 8,
      },
      {
        id: 'wt-e1-002-03',
        instruction: 'What do you do at the weekend? Write two sentences.',
        minWords: 10,
        hint: 'Think about Saturday or Sunday. Do you stay home or go out?',
      },
      {
        id: 'wt-e1-002-04',
        instruction: 'Do you go to school or work? Write two sentences about it.',
        minWords: 10,
      },
      {
        id: 'wt-e1-002-05',
        instruction: 'Write about something you buy at a shop. What is it and how much does it cost?',
        minWords: 8,
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "w-e1-003",
    title: "Mina's Family Photo",
    level: "entry-1",
    type: "report",
    prompt: "Write about mina's family photo. Say where you are, what you need to do, and what happens next.",
    audience: "Your teacher",
    purpose: "To give simple personal or factual information",
    wordCountGuidance: "Write short clear sentences",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e1-003-01",
        instruction: "Introduce the topic of mina's family photo and say why it is important.",
        minWords: 8,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e1-003-02",
        instruction: "Write where the situation happens. Include classroom and Mina's desk.",
        minWords: 8,
      },
      {
        id: "wt-e1-003-03",
        instruction: "Explain the action needed: show a family photo. Give a reason for this action.",
        minWords: 8,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e1-003-04",
        instruction: "Mention the time, day, or deadline: Monday morning. Explain what could happen if someone forgets it.",
        minWords: 8,
      },
      {
        id: "wt-e1-003-05",
        instruction: "Finish by explaining the expected result: write three names. Add a clear final sentence.",
        minWords: 8,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
  {
    id: "w-e1-004",
    title: "The Morning Class",
    level: "entry-1",
    type: "review",
    prompt: "Write about the morning class. Say where you are, what you need to do, and what happens next.",
    audience: "Your teacher",
    purpose: "To give simple personal or factual information",
    wordCountGuidance: "Write short clear sentences",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e1-004-01",
        instruction: "Introduce the topic of the morning class and say why it is important.",
        minWords: 8,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e1-004-02",
        instruction: "Write where the situation happens. Include English room and Room 4.",
        minWords: 8,
      },
      {
        id: "wt-e1-004-03",
        instruction: "Explain the action needed: read five new words. Give a reason for this action.",
        minWords: 8,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e1-004-04",
        instruction: "Mention the time, day, or deadline: 9:30. Explain what could happen if someone forgets it.",
        minWords: 8,
      },
      {
        id: "wt-e1-004-05",
        instruction: "Finish by explaining the expected result: finish a short worksheet. Add a clear final sentence.",
        minWords: 8,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
  {
    id: "w-e1-005",
    title: "At the Corner Shop",
    level: "entry-1",
    type: "formal_letter",
    prompt: "Write about at the corner shop. Say where you are, what you need to do, and what happens next.",
    audience: "Your teacher",
    purpose: "To give simple personal or factual information",
    wordCountGuidance: "Write short clear sentences",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e1-005-01",
        instruction: "Introduce the topic of at the corner shop and say why it is important.",
        minWords: 8,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e1-005-02",
        instruction: "Write where the situation happens. Include corner shop and the fruit shelf.",
        minWords: 8,
      },
      {
        id: "wt-e1-005-03",
        instruction: "Explain the action needed: buy two apples. Give a reason for this action.",
        minWords: 8,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e1-005-04",
        instruction: "Mention the time, day, or deadline: after school. Explain what could happen if someone forgets it.",
        minWords: 8,
      },
      {
        id: "wt-e1-005-05",
        instruction: "Finish by explaining the expected result: walk home. Add a clear final sentence.",
        minWords: 8,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
]
