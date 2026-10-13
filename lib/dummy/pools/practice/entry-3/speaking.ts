/**
 * Entry Level 3 — Speaking practice pool.
 * Phase 10a: restructured to 2 topics × 5 atomic SpeakingTask items each.
 * SHAPE:     SpeakingTopic with tasks array of 5 opinion-based spoken responses.
 * COMPLEXITY: State an opinion with reasons, handle counter-arguments, compare viewpoints.
 * REFERENCE:  Karani's entry assessment PDF oral component advanced.
 */
import type { SpeakingTopic } from '@/types/platform'

export const ENTRY_3_SPEAKING: SpeakingTopic[] = [
  {
    id: 's-e3-001',
    title: 'School Uniform',
    level: 'entry-3',
    format: 'discussion',
    scenario: 'You are having a discussion with your tutor about whether schools should have uniforms.',
    openingPrompt: 'Do you think schools should have uniforms? Tell me what you think and give a reason for your opinion.',
    followUpPrompts: [
      'Some people say uniforms stop bullying about clothes. Do you agree with that?',
    ],
    assessmentFocus: [
      'Expressing an opinion clearly with a supporting reason',
      'Responding to a follow-up question with relevant detail',
      'Using appropriate language for a discussion',
    ],
    tasks: [
      {
        id: 'st-e3-001-01',
        instruction: 'State whether you think school uniforms are a good or bad idea. Give one clear reason for your opinion.',
        expectedDurationSec: 30,
        hint: 'Use "I believe… because…" to structure your answer.',
      },
      {
        id: 'st-e3-001-02',
        instruction: 'Give a second reason to support your opinion about school uniforms. Try to use a different point from your first answer.',
        expectedDurationSec: 30,
      },
      {
        id: 'st-e3-001-03',
        instruction: 'Some people disagree with your view. What would someone on the other side say? Explain their argument.',
        expectedDurationSec: 30,
        hint: 'Start with "On the other hand, some people think…"',
      },
      {
        id: 'st-e3-001-04',
        instruction: 'Compare schools that have uniforms with schools that do not. Which students might be happier, and why?',
        expectedDurationSec: 30,
      },
      {
        id: 'st-e3-001-05',
        instruction: 'Sum up the discussion. What is your final opinion on school uniforms after thinking about both sides?',
        expectedDurationSec: 30,
        hint: 'Try: "After considering both sides, I still think… because…"',
      },
    ],
  },
  {
    id: 's-e3-002',
    title: 'Healthy Eating',
    level: 'entry-3',
    format: 'discussion',
    scenario: 'You are talking with your tutor about whether young people eat healthily enough today.',
    openingPrompt: 'Do you think young people eat enough healthy food? Why or why not?',
    followUpPrompts: [
      'Some people say that schools should ban junk food. What do you think about that?',
    ],
    assessmentFocus: [
      'Giving an opinion with supporting reasons',
      'Discussing a familiar topic with some detail',
      'Responding thoughtfully to a counter-argument',
    ],
    tasks: [
      {
        id: 'st-e3-002-01',
        instruction: 'Do you think most young people eat healthily? State your opinion and give one reason.',
        expectedDurationSec: 30,
      },
      {
        id: 'st-e3-002-02',
        instruction: 'Why do some teenagers choose fast food over healthy meals? Give two possible reasons.',
        expectedDurationSec: 30,
        hint: 'Think about cost, taste, time, or advertising.',
      },
      {
        id: 'st-e3-002-03',
        instruction: 'Some people say schools should only sell healthy food. Do you agree or disagree? Explain why.',
        expectedDurationSec: 30,
      },
      {
        id: 'st-e3-002-04',
        instruction: 'What could families do at home to encourage healthier eating? Suggest one practical idea.',
        expectedDurationSec: 30,
        hint: 'Think about cooking together, planning meals, or reducing takeaways.',
      },
      {
        id: 'st-e3-002-05',
        instruction: 'Finish the discussion: whose responsibility is it to make sure young people eat well — schools, parents, or the young people themselves?',
        expectedDurationSec: 30,
      },
    ],
  },
  // Additional demonstration sets imported from the full practice question bank.
  {
    id: "s-e3-003",
    title: "Bank Account Notice",
    level: "entry-3",
    format: "discussion",
    scenario: "You are in a practical discussion about bank account notice.",
    openingPrompt: "Describe the situation, explain the action needed, and give one reason.",
    followUpPrompts: [
      "Can you explain more about update personal contact details?",
      "Why is before the end of the month important?",
      "What could happen after people avoid account restrictions?",
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
        id: "st-e3-003-01",
        instruction: "Say what bank account notice is about and give one important detail.",
        expectedDurationSec: 30,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e3-003-02",
        instruction: "Explain where it happens. Include bank branch and customer waiting area.",
        expectedDurationSec: 30,
      },
      {
        id: "st-e3-003-03",
        instruction: "Describe the action needed: update personal contact details. Say why this action is useful.",
        expectedDurationSec: 30,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e3-003-04",
        instruction: "Mention the key time, day, or deadline: before the end of the month. Explain why timing matters.",
        expectedDurationSec: 30,
      },
      {
        id: "st-e3-003-05",
        instruction: "Give a final opinion about the expected result: avoid account restrictions.",
        expectedDurationSec: 30,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
  {
    id: "s-e3-004",
    title: "Course Feedback Survey",
    level: "entry-3",
    format: "presentation",
    scenario: "You are in a practical discussion about course feedback survey.",
    openingPrompt: "Describe the situation, explain the action needed, and give one reason.",
    followUpPrompts: [
      "Can you explain more about complete a course feedback survey?",
      "Why is 10 minutes important?",
      "What could happen after people help improve future lessons?",
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
        id: "st-e3-004-01",
        instruction: "Say what course feedback survey is about and give one important detail.",
        expectedDurationSec: 30,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e3-004-02",
        instruction: "Explain where it happens. Include online learning portal and student dashboard.",
        expectedDurationSec: 30,
      },
      {
        id: "st-e3-004-03",
        instruction: "Describe the action needed: complete a course feedback survey. Say why this action is useful.",
        expectedDurationSec: 30,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e3-004-04",
        instruction: "Mention the key time, day, or deadline: 10 minutes. Explain why timing matters.",
        expectedDurationSec: 30,
      },
      {
        id: "st-e3-004-05",
        instruction: "Give a final opinion about the expected result: help improve future lessons.",
        expectedDurationSec: 30,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
  {
    id: "s-e3-005",
    title: "Travel Delay Claim",
    level: "entry-3",
    format: "discussion",
    scenario: "You are in a practical discussion about travel delay claim.",
    openingPrompt: "Describe the situation, explain the action needed, and give one reason.",
    followUpPrompts: [
      "Can you explain more about submit a delay claim?",
      "Why is within seven days important?",
      "What could happen after people attach a ticket photo?",
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
        id: "st-e3-005-01",
        instruction: "Say what travel delay claim is about and give one important detail.",
        expectedDurationSec: 30,
        hint: "Begin with a clear topic sentence.",
      },
      {
        id: "st-e3-005-02",
        instruction: "Explain where it happens. Include bus company website and customer support page.",
        expectedDurationSec: 30,
      },
      {
        id: "st-e3-005-03",
        instruction: "Describe the action needed: submit a delay claim. Say why this action is useful.",
        expectedDurationSec: 30,
        hint: "Use because to connect your reason.",
      },
      {
        id: "st-e3-005-04",
        instruction: "Mention the key time, day, or deadline: within seven days. Explain why timing matters.",
        expectedDurationSec: 30,
      },
      {
        id: "st-e3-005-05",
        instruction: "Give a final opinion about the expected result: attach a ticket photo.",
        expectedDurationSec: 30,
        hint: "End with your own view or recommendation.",
      },
    ],
  },
]
