/**
 * Entry Level 2 — Speaking practice pool.
 * Phase 10a: restructured to 2 topics × 5 atomic SpeakingTask items each.
 * SHAPE:     SpeakingTopic with tasks array of 5 descriptive spoken responses.
 * COMPLEXITY: Simple descriptions with some detail, 3–5 sentence responses.
 * REFERENCE:  Karani's entry assessment PDF oral component mid-level.
 */
import type { SpeakingTopic } from '@/types/platform'

export const ENTRY_2_SPEAKING: SpeakingTopic[] = [
  {
    id: 's-e2-001',
    title: 'Your Favourite Hobby',
    level: 'entry-2',
    format: 'discussion',
    scenario: 'Your teacher asks you to talk about something you enjoy doing in your free time.',
    openingPrompt: 'What do you like to do in your free time? Tell me about your favourite hobby.',
    followUpPrompts: [
      'How often do you do this hobby, and who do you do it with?',
    ],
    assessmentFocus: [
      'Speaking in clear, complete sentences',
      'Giving basic details about a familiar topic',
      'Responding to a follow-up question',
    ],
    tasks: [
      {
        id: 'st-e2-001-01',
        instruction: 'Describe your favourite hobby. What is it, and when did you start doing it?',
        expectedDurationSec: 25,
        hint: 'Say what the hobby is first, then when you started — for example, "last year" or "when I was young".',
      },
      {
        id: 'st-e2-001-02',
        instruction: 'How often do you do this hobby? Tell me which days or times you usually do it.',
        expectedDurationSec: 25,
      },
      {
        id: 'st-e2-001-03',
        instruction: 'Do you do this hobby alone or with someone else? Describe who joins you.',
        expectedDurationSec: 25,
      },
      {
        id: 'st-e2-001-04',
        instruction: 'Why do you enjoy this hobby? Give two reasons.',
        expectedDurationSec: 25,
        hint: 'Use words like "because" and "also" to connect your reasons.',
      },
      {
        id: 'st-e2-001-05',
        instruction: 'Would you recommend this hobby to a friend? Say why or why not.',
        expectedDurationSec: 25,
      },
    ],
  },
  {
    id: 's-e2-002',
    title: 'Talking About People',
    level: 'entry-2',
    format: 'discussion',
    scenario: 'Your teacher asks you to describe some people that you know.',
    openingPrompt: 'Can you tell me about someone important in your life?',
    followUpPrompts: [
      'What does this person look like? Can you describe them?',
    ],
    assessmentFocus: [
      'Using adjectives to describe people',
      'Speaking about others in clear sentences',
      'Distinguishing between appearance and personality',
    ],
    tasks: [
      {
        id: 'st-e2-002-01',
        instruction: 'Describe your best friend. What is their name, and how did you meet?',
        expectedDurationSec: 25,
        hint: 'Start with their name, then say where or when you met them.',
      },
      {
        id: 'st-e2-002-02',
        instruction: 'Tell me about one person in your family. What do they do every day?',
        expectedDurationSec: 25,
      },
      {
        id: 'st-e2-002-03',
        instruction: 'Think of a teacher you like. What makes them a good teacher?',
        expectedDurationSec: 25,
        hint: 'Think about how they explain things, or how they help students.',
      },
      {
        id: 'st-e2-002-04',
        instruction: 'Pick someone in this room or someone you saw today. Describe what they look like.',
        expectedDurationSec: 25,
      },
      {
        id: 'st-e2-002-05',
        instruction: 'Describe the personality of someone you admire. Are they kind, funny, or brave? Explain.',
        expectedDurationSec: 25,
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "s-e2-003",
    title: "Part-Time Job Notice",
    level: "entry-2",
    format: "discussion",
    scenario: "You are talking to a classmate about part-time job notice.",
    openingPrompt: "Explain what is happening and what someone should do.",
    followUpPrompts: [
      "Can you explain more about apply for weekend work?",
      "Why is Friday afternoon important?",
      "What could happen after people complete an online form?",
    ],
    assessmentFocus: [
      "Clear pronunciation",
      "Relevant answer",
      "Suitable vocabulary",
      "Logical order",
      "Confidence and fluency",
    ],
    tasks: [
      {
        id: "st-e2-003-01",
        instruction: "Say what part-time job notice is about and give one important detail.",
        expectedDurationSec: 25,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e2-003-02",
        instruction: "Explain where it happens. Include supermarket and customer service desk.",
        expectedDurationSec: 25,
      },
      {
        id: "st-e2-003-03",
        instruction: "Describe the action needed: apply for weekend work. Say why this action is useful.",
        expectedDurationSec: 25,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e2-003-04",
        instruction: "Mention the key time, day, or deadline: Friday afternoon. Explain why timing matters.",
        expectedDurationSec: 25,
      },
      {
        id: "st-e2-003-05",
        instruction: "Give a final opinion about the expected result: complete an online form.",
        expectedDurationSec: 25,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
  {
    id: "s-e2-004",
    title: "Train Journey Update",
    level: "entry-2",
    format: "presentation",
    scenario: "You are talking to a classmate about train journey update.",
    openingPrompt: "Explain what is happening and what someone should do.",
    followUpPrompts: [
      "Can you explain more about take the slower train?",
      "Why is 18 minutes later important?",
      "What could happen after people keep the same ticket?",
    ],
    assessmentFocus: [
      "Clear pronunciation",
      "Relevant answer",
      "Suitable vocabulary",
      "Logical order",
      "Confidence and fluency",
    ],
    tasks: [
      {
        id: "st-e2-004-01",
        instruction: "Say what train journey update is about and give one important detail.",
        expectedDurationSec: 25,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e2-004-02",
        instruction: "Explain where it happens. Include train station and Platform 2.",
        expectedDurationSec: 25,
      },
      {
        id: "st-e2-004-03",
        instruction: "Describe the action needed: take the slower train. Say why this action is useful.",
        expectedDurationSec: 25,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e2-004-04",
        instruction: "Mention the key time, day, or deadline: 18 minutes later. Explain why timing matters.",
        expectedDurationSec: 25,
      },
      {
        id: "st-e2-004-05",
        instruction: "Give a final opinion about the expected result: keep the same ticket.",
        expectedDurationSec: 25,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
  {
    id: "s-e2-005",
    title: "Flat Share Message",
    level: "entry-2",
    format: "discussion",
    scenario: "You are talking to a classmate about flat share message.",
    openingPrompt: "Explain what is happening and what someone should do.",
    followUpPrompts: [
      "Can you explain more about clean the kitchen after dinner?",
      "Why is every Thursday important?",
      "What could happen after people sign the rota?",
    ],
    assessmentFocus: [
      "Clear pronunciation",
      "Relevant answer",
      "Suitable vocabulary",
      "Logical order",
      "Confidence and fluency",
    ],
    tasks: [
      {
        id: "st-e2-005-01",
        instruction: "Say what flat share message is about and give one important detail.",
        expectedDurationSec: 25,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e2-005-02",
        instruction: "Explain where it happens. Include shared flat and kitchen notice board.",
        expectedDurationSec: 25,
      },
      {
        id: "st-e2-005-03",
        instruction: "Describe the action needed: clean the kitchen after dinner. Say why this action is useful.",
        expectedDurationSec: 25,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e2-005-04",
        instruction: "Mention the key time, day, or deadline: every Thursday. Explain why timing matters.",
        expectedDurationSec: 25,
      },
      {
        id: "st-e2-005-05",
        instruction: "Give a final opinion about the expected result: sign the rota.",
        expectedDurationSec: 25,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
]
