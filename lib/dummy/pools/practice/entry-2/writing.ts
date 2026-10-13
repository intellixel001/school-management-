/**
 * Entry Level 2 — Writing practice pool.
 * SHAPE:     WritingPrompt with 4–5 sentence expected output on familiar topic.
 *            Phase 10a restructured: each prompt contains 5 atomic WritingTask items.
 * COMPLEXITY: Personal paragraph (daily routine, hobbies), basic sentence structure.
 * REFERENCE:  Karani's entry assessment PDF Section B mid-level tasks.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 */
import type { WritingPrompt } from '@/types/platform'

export const ENTRY_2_WRITING: WritingPrompt[] = [
  {
    id: 'w-e2-001',
    title: 'My Daily Routine',
    level: 'entry-2',
    type: 'article',
    prompt: 'Write a short paragraph about your daily routine. Include what time you wake up, what you do during the day, and what you do in the evening.',
    audience: 'Your teacher',
    purpose: 'To describe your daily routine clearly',
    wordCountGuidance: 'Write 4 to 5 sentences',
    criteria: [
      'Writing in clear, complete sentences',
      'Putting events in a logical order',
      'Using capital letters and full stops correctly',
    ],
    tasks: [
      {
        id: 'wt-e2-001-01',
        instruction: 'Describe what you do every morning from waking up to leaving the house. Write three or four sentences.',
        minWords: 15,
        hint: 'Include the time you wake up and mention breakfast or getting ready.',
      },
      {
        id: 'wt-e2-001-02',
        instruction: 'Write a short paragraph about what you usually eat for lunch and dinner. Who do you eat with?',
        minWords: 15,
      },
      {
        id: 'wt-e2-001-03',
        instruction: 'How do you travel to school or work? Describe your journey in three sentences.',
        minWords: 15,
        hint: 'Say how long the journey takes and what you see on the way.',
      },
      {
        id: 'wt-e2-001-04',
        instruction: 'What do you do in the evening after school or work? Write three or four sentences about your evening routine.',
        minWords: 15,
      },
      {
        id: 'wt-e2-001-05',
        instruction: 'Describe your plans for next weekend. What would you like to do and who will you spend time with?',
        minWords: 15,
        hint: 'Use future phrases like "I am going to…" or "I would like to…"',
      },
    ],
  },
  {
    id: 'w-e2-002',
    title: 'My Neighbourhood',
    level: 'entry-2',
    type: 'article',
    prompt: 'Write a short paragraph about the area where you live. Describe the shops, people, and places you visit.',
    audience: 'A classmate',
    purpose: 'To describe your local neighbourhood',
    wordCountGuidance: 'Write 4 to 5 sentences',
    criteria: [
      'Writing in clear, complete sentences',
      'Using descriptive words to give detail',
      'Using capital letters and full stops correctly',
    ],
    tasks: [
      {
        id: 'wt-e2-002-01',
        instruction: 'What shops are near your home? Write three sentences about two or three shops and what they sell.',
        minWords: 15,
        hint: 'Name the shops and say what you can buy there.',
      },
      {
        id: 'wt-e2-002-02',
        instruction: 'Describe one of your neighbours. What are they like and how often do you see them?',
        minWords: 15,
      },
      {
        id: 'wt-e2-002-03',
        instruction: 'A visitor asks how to get from the bus stop to your home. Write simple directions in three sentences.',
        minWords: 15,
        hint: 'Use words like "turn left", "go straight", and "next to".',
      },
      {
        id: 'wt-e2-002-04',
        instruction: 'What is your favourite place in your neighbourhood? Write three or four sentences explaining why you like it.',
        minWords: 15,
      },
      {
        id: 'wt-e2-002-05',
        instruction: 'If you could change one thing about your neighbourhood, what would it be? Explain why.',
        minWords: 15,
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "w-e2-003",
    title: "Part-Time Job Notice",
    level: "entry-2",
    type: "report",
    prompt: "Write a short message about part-time job notice. Explain that the reader should go to customer service desk, apply for weekend work, and remember Friday afternoon.",
    audience: "A classmate or member of staff",
    purpose: "To pass on practical information clearly",
    wordCountGuidance: "Write one short paragraph",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e2-003-01",
        instruction: "Introduce the topic of part-time job notice and say why it is important.",
        minWords: 12,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e2-003-02",
        instruction: "Write where the situation happens. Include supermarket and customer service desk.",
        minWords: 12,
      },
      {
        id: "wt-e2-003-03",
        instruction: "Explain the action needed: apply for weekend work. Give a reason for this action.",
        minWords: 12,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e2-003-04",
        instruction: "Mention the time, day, or deadline: Friday afternoon. Explain what could happen if someone forgets it.",
        minWords: 12,
      },
      {
        id: "wt-e2-003-05",
        instruction: "Finish by explaining the expected result: complete an online form. Add a clear final sentence.",
        minWords: 12,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
  {
    id: "w-e2-004",
    title: "Train Journey Update",
    level: "entry-2",
    type: "review",
    prompt: "Write a short message about train journey update. Explain that the reader should go to Platform 2, take the slower train, and remember 18 minutes later.",
    audience: "A classmate or member of staff",
    purpose: "To pass on practical information clearly",
    wordCountGuidance: "Write one short paragraph",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e2-004-01",
        instruction: "Introduce the topic of train journey update and say why it is important.",
        minWords: 12,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e2-004-02",
        instruction: "Write where the situation happens. Include train station and Platform 2.",
        minWords: 12,
      },
      {
        id: "wt-e2-004-03",
        instruction: "Explain the action needed: take the slower train. Give a reason for this action.",
        minWords: 12,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e2-004-04",
        instruction: "Mention the time, day, or deadline: 18 minutes later. Explain what could happen if someone forgets it.",
        minWords: 12,
      },
      {
        id: "wt-e2-004-05",
        instruction: "Finish by explaining the expected result: keep the same ticket. Add a clear final sentence.",
        minWords: 12,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
  {
    id: "w-e2-005",
    title: "Flat Share Message",
    level: "entry-2",
    type: "formal_letter",
    prompt: "Write a short message about flat share message. Explain that the reader should go to kitchen notice board, clean the kitchen after dinner, and remember every Thursday.",
    audience: "A classmate or member of staff",
    purpose: "To pass on practical information clearly",
    wordCountGuidance: "Write one short paragraph",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e2-005-01",
        instruction: "Introduce the topic of flat share message and say why it is important.",
        minWords: 12,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e2-005-02",
        instruction: "Write where the situation happens. Include shared flat and kitchen notice board.",
        minWords: 12,
      },
      {
        id: "wt-e2-005-03",
        instruction: "Explain the action needed: clean the kitchen after dinner. Give a reason for this action.",
        minWords: 12,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e2-005-04",
        instruction: "Mention the time, day, or deadline: every Thursday. Explain what could happen if someone forgets it.",
        minWords: 12,
      },
      {
        id: "wt-e2-005-05",
        instruction: "Finish by explaining the expected result: sign the rota. Add a clear final sentence.",
        minWords: 12,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
]
