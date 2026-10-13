/**
 * Entry Level 3 — Writing practice pool.
 * SHAPE:     WritingPrompt with 6–10 sentence structured output, formal email or short letter.
 *            Phase 10a restructured: each prompt contains 5 atomic WritingTask items.
 * COMPLEXITY: Intro + body paragraph, basic discourse markers, formal register.
 * REFERENCE:  Karani's entry assessment PDF Section B advanced tasks.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 */
import type { WritingPrompt } from '@/types/platform'

export const ENTRY_3_WRITING: WritingPrompt[] = [
  {
    id: 'w-e3-001',
    title: 'Email to a Neighbour',
    level: 'entry-3',
    type: 'email',
    prompt: 'Your neighbour has been playing loud music late at night and it is affecting your sleep. Write a polite but firm email to your neighbour asking them to keep the noise down. In your email you should explain the problem, say how it affects you, and suggest a solution.',
    audience: 'Your neighbour',
    purpose: 'To politely request a change in behaviour',
    wordCountGuidance: 'Write 6 to 10 sentences',
    criteria: [
      'Writing clearly for the purpose and audience',
      'Using a polite but firm tone',
      'Organising ideas with a clear opening and closing',
      'Using correct spelling, punctuation and grammar',
    ],
    tasks: [
      {
        id: 'wt-e3-001-01',
        instruction: 'Write a polite greeting and opening sentence for your email. Introduce yourself and say why you are writing.',
        minWords: 20,
        hint: 'Start with "Dear…" and explain the reason for your email in one or two sentences.',
      },
      {
        id: 'wt-e3-001-02',
        instruction: 'Explain the problem clearly. What is happening and when does it happen? Write two or three sentences.',
        minWords: 20,
      },
      {
        id: 'wt-e3-001-03',
        instruction: 'Describe how the noise is affecting you. Mention sleep, work, or daily life in two sentences.',
        minWords: 20,
        hint: 'Use phrases like "As a result…" or "Because of this…" to connect your ideas.',
      },
      {
        id: 'wt-e3-001-04',
        instruction: 'Suggest a reasonable solution to the problem. Write two sentences offering a compromise.',
        minWords: 20,
      },
      {
        id: 'wt-e3-001-05',
        instruction: 'Write a polite closing for your email. Thank the reader and sign off appropriately.',
        minWords: 15,
        hint: 'End with "Kind regards" or "Best wishes" followed by your name.',
      },
    ],
  },
  {
    id: 'w-e3-002',
    title: 'Job Application Letter',
    level: 'entry-3',
    type: 'formal_letter',
    prompt: 'You have seen an advert for a part-time shop assistant position at a local supermarket. Write a formal letter applying for the job. Include why you are interested, your relevant experience, and when you are available.',
    audience: 'The hiring manager',
    purpose: 'To apply for a job formally and persuasively',
    wordCountGuidance: 'Write 6 to 10 sentences',
    criteria: [
      'Using the correct format for a formal letter',
      'Writing clearly about skills and experience',
      'Maintaining a formal and professional tone throughout',
      'Using correct spelling, punctuation and grammar',
    ],
    tasks: [
      {
        id: 'wt-e3-002-01',
        instruction: 'Write the opening of your letter. State which job you are applying for and where you saw the advert.',
        minWords: 20,
        hint: 'Begin with "Dear Sir or Madam" and say "I am writing to apply for…"',
      },
      {
        id: 'wt-e3-002-02',
        instruction: 'Describe any relevant experience you have. This could be work, volunteering, or helping at home. Write two or three sentences.',
        minWords: 20,
      },
      {
        id: 'wt-e3-002-03',
        instruction: 'Write about two skills that make you suitable for the job. Give a brief example for each skill.',
        minWords: 20,
        hint: 'Think about skills like teamwork, communication, or being organised.',
      },
      {
        id: 'wt-e3-002-04',
        instruction: 'State when you are available to work. Mention specific days or times if possible.',
        minWords: 15,
      },
      {
        id: 'wt-e3-002-05',
        instruction: 'Write a formal closing paragraph. Thank the reader for their time and say you look forward to hearing from them.',
        minWords: 20,
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "w-e3-003",
    title: "Bank Account Notice",
    level: "entry-3",
    type: "report",
    prompt: "Write an email about bank account notice. Explain the situation, the action needed, the deadline, and why the outcome matters.",
    audience: "A student services officer or workplace supervisor",
    purpose: "To explain a practical situation and request or give action",
    wordCountGuidance: "Write two organised paragraphs",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e3-003-01",
        instruction: "Introduce the topic of bank account notice and say why it is important.",
        minWords: 18,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e3-003-02",
        instruction: "Write where the situation happens. Include bank branch and customer waiting area.",
        minWords: 18,
      },
      {
        id: "wt-e3-003-03",
        instruction: "Explain the action needed: update personal contact details. Give a reason for this action.",
        minWords: 18,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e3-003-04",
        instruction: "Mention the time, day, or deadline: before the end of the month. Explain what could happen if someone forgets it.",
        minWords: 18,
      },
      {
        id: "wt-e3-003-05",
        instruction: "Finish by explaining the expected result: avoid account restrictions. Add a clear final sentence.",
        minWords: 18,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
  {
    id: "w-e3-004",
    title: "Course Feedback Survey",
    level: "entry-3",
    type: "review",
    prompt: "Write an email about course feedback survey. Explain the situation, the action needed, the deadline, and why the outcome matters.",
    audience: "A student services officer or workplace supervisor",
    purpose: "To explain a practical situation and request or give action",
    wordCountGuidance: "Write two organised paragraphs",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e3-004-01",
        instruction: "Introduce the topic of course feedback survey and say why it is important.",
        minWords: 18,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e3-004-02",
        instruction: "Write where the situation happens. Include online learning portal and student dashboard.",
        minWords: 18,
      },
      {
        id: "wt-e3-004-03",
        instruction: "Explain the action needed: complete a course feedback survey. Give a reason for this action.",
        minWords: 18,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e3-004-04",
        instruction: "Mention the time, day, or deadline: 10 minutes. Explain what could happen if someone forgets it.",
        minWords: 18,
      },
      {
        id: "wt-e3-004-05",
        instruction: "Finish by explaining the expected result: help improve future lessons. Add a clear final sentence.",
        minWords: 18,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
  {
    id: "w-e3-005",
    title: "Travel Delay Claim",
    level: "entry-3",
    type: "formal_letter",
    prompt: "Write an email about travel delay claim. Explain the situation, the action needed, the deadline, and why the outcome matters.",
    audience: "A student services officer or workplace supervisor",
    purpose: "To explain a practical situation and request or give action",
    wordCountGuidance: "Write two organised paragraphs",
    criteria: [
      "Address the task clearly",
      "Organise ideas logically",
      "Use vocabulary suitable for the level",
      "Use accurate grammar, spelling, and punctuation",
      "Use an appropriate tone for the audience",
    ],
    tasks: [
      {
        id: "wt-e3-005-01",
        instruction: "Introduce the topic of travel delay claim and say why it is important.",
        minWords: 18,
        hint: "Start with the main situation before adding details.",
      },
      {
        id: "wt-e3-005-02",
        instruction: "Write where the situation happens. Include bus company website and customer support page.",
        minWords: 18,
      },
      {
        id: "wt-e3-005-03",
        instruction: "Explain the action needed: submit a delay claim. Give a reason for this action.",
        minWords: 18,
        hint: "Use because, so, or therefore to link your ideas.",
      },
      {
        id: "wt-e3-005-04",
        instruction: "Mention the time, day, or deadline: within seven days. Explain what could happen if someone forgets it.",
        minWords: 18,
      },
      {
        id: "wt-e3-005-05",
        instruction: "Finish by explaining the expected result: attach a ticket photo. Add a clear final sentence.",
        minWords: 18,
        hint: "End with a sentence that summarises the message.",
      },
    ],
  },
]
