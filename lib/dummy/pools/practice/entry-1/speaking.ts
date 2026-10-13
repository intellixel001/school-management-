/**
 * Entry Level 1 — Speaking practice pool.
 * Phase 10a: restructured to 2 topics × 5 atomic SpeakingTask items each.
 * SHAPE:     SpeakingTopic with tasks array of 5 very simple spoken responses.
 * COMPLEXITY: 1–2 sentence personal statements. "Tell me your name." No discussion.
 * REFERENCE:  Karani's entry assessment PDF oral component.
 */
import type { SpeakingTopic } from '@/types/platform'

export const ENTRY_1_SPEAKING: SpeakingTopic[] = [
  {
    id: 's-e1-001',
    title: 'Introduce Yourself',
    level: 'entry-1',
    format: 'discussion',
    scenario: 'Your teacher asks you to say a little bit about yourself.',
    openingPrompt: 'Hello! Can you tell me your name and where you are from?',
    followUpPrompts: [],
    assessmentFocus: [
      'Saying your name clearly',
      'Giving basic personal information',
    ],
    tasks: [
      {
        id: 'st-e1-001-01',
        instruction: 'Say your full name and spell your first name out loud.',
        expectedDurationSec: 20,
        hint: 'Start with "My name is…" then spell each letter slowly.',
      },
      {
        id: 'st-e1-001-02',
        instruction: 'Tell me which country or city you are from.',
        expectedDurationSec: 20,
      },
      {
        id: 'st-e1-001-03',
        instruction: 'What is your favourite food? Say one sentence about it.',
        expectedDurationSec: 20,
        hint: 'Try: "My favourite food is… because it is…"',
      },
      {
        id: 'st-e1-001-04',
        instruction: 'Tell me about your family. How many people are in your family?',
        expectedDurationSec: 20,
      },
      {
        id: 'st-e1-001-05',
        instruction: 'What do you like to do after school? Say one thing.',
        expectedDurationSec: 20,
      },
    ],
  },
  {
    id: 's-e1-002',
    title: 'Things Around You',
    level: 'entry-1',
    format: 'discussion',
    scenario: 'Your teacher points at different things in the room and asks you to talk about them.',
    openingPrompt: 'Look around the room. Can you tell me what you can see?',
    followUpPrompts: [],
    assessmentFocus: [
      'Naming everyday objects clearly',
      'Using simple describing words',
    ],
    tasks: [
      {
        id: 'st-e1-002-01',
        instruction: 'Name three things you can see in your classroom right now.',
        expectedDurationSec: 20,
        hint: 'Look at the walls, tables, and your bag for ideas.',
      },
      {
        id: 'st-e1-002-02',
        instruction: 'What colour is your shirt today? Say the colour in a full sentence.',
        expectedDurationSec: 20,
      },
      {
        id: 'st-e1-002-03',
        instruction: 'What are you wearing on your feet? Describe them.',
        expectedDurationSec: 20,
      },
      {
        id: 'st-e1-002-04',
        instruction: 'Count from one to ten out loud in English.',
        expectedDurationSec: 20,
        hint: 'Speak slowly and clearly: one, two, three…',
      },
      {
        id: 'st-e1-002-05',
        instruction: 'What time do you wake up in the morning? Say it in a sentence.',
        expectedDurationSec: 20,
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "s-e1-003",
    title: "Mina's Family Photo",
    level: "entry-1",
    format: "discussion",
    scenario: "Your teacher asks you simple questions about mina's family photo.",
    openingPrompt: "Tell me about mina's family photo in one or two simple sentences.",
    followUpPrompts: [
      "Can you explain more about show a family photo?",
      "Why is Monday morning important?",
      "What could happen after people write three names?",
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
        id: "st-e1-003-01",
        instruction: "Say what mina's family photo is about and give one important detail.",
        expectedDurationSec: 20,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e1-003-02",
        instruction: "Explain where it happens. Include classroom and Mina's desk.",
        expectedDurationSec: 20,
      },
      {
        id: "st-e1-003-03",
        instruction: "Describe the action needed: show a family photo. Say why this action is useful.",
        expectedDurationSec: 20,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e1-003-04",
        instruction: "Mention the key time, day, or deadline: Monday morning. Explain why timing matters.",
        expectedDurationSec: 20,
      },
      {
        id: "st-e1-003-05",
        instruction: "Give a final opinion about the expected result: write three names.",
        expectedDurationSec: 20,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
  {
    id: "s-e1-004",
    title: "The Morning Class",
    level: "entry-1",
    format: "presentation",
    scenario: "Your teacher asks you simple questions about the morning class.",
    openingPrompt: "Tell me about the morning class in one or two simple sentences.",
    followUpPrompts: [
      "Can you explain more about read five new words?",
      "Why is 9:30 important?",
      "What could happen after people finish a short worksheet?",
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
        id: "st-e1-004-01",
        instruction: "Say what the morning class is about and give one important detail.",
        expectedDurationSec: 20,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e1-004-02",
        instruction: "Explain where it happens. Include English room and Room 4.",
        expectedDurationSec: 20,
      },
      {
        id: "st-e1-004-03",
        instruction: "Describe the action needed: read five new words. Say why this action is useful.",
        expectedDurationSec: 20,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e1-004-04",
        instruction: "Mention the key time, day, or deadline: 9:30. Explain why timing matters.",
        expectedDurationSec: 20,
      },
      {
        id: "st-e1-004-05",
        instruction: "Give a final opinion about the expected result: finish a short worksheet.",
        expectedDurationSec: 20,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
  {
    id: "s-e1-005",
    title: "At the Corner Shop",
    level: "entry-1",
    format: "discussion",
    scenario: "Your teacher asks you simple questions about at the corner shop.",
    openingPrompt: "Tell me about at the corner shop in one or two simple sentences.",
    followUpPrompts: [
      "Can you explain more about buy two apples?",
      "Why is after school important?",
      "What could happen after people walk home?",
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
        id: "st-e1-005-01",
        instruction: "Say what at the corner shop is about and give one important detail.",
        expectedDurationSec: 20,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e1-005-02",
        instruction: "Explain where it happens. Include corner shop and the fruit shelf.",
        expectedDurationSec: 20,
      },
      {
        id: "st-e1-005-03",
        instruction: "Describe the action needed: buy two apples. Say why this action is useful.",
        expectedDurationSec: 20,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e1-005-04",
        instruction: "Mention the key time, day, or deadline: after school. Explain why timing matters.",
        expectedDurationSec: 20,
      },
      {
        id: "st-e1-005-05",
        instruction: "Give a final opinion about the expected result: walk home.",
        expectedDurationSec: 20,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
]
