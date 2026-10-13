/**
 * Level 1 — Speaking practice pool.
 * Phase 10a: restructured to 2 topics × 5 atomic SpeakingTask items each.
 * SHAPE:     SpeakingTopic with tasks array of 5 formal discussion tasks.
 * COMPLEXITY: IELTS-style — opinions with evidence, counterarguments, structured reasoning.
 * REFERENCE:  Karani's FS Level 2 speaking assessment criteria.
 */
import type { SpeakingTopic } from '@/types/platform'

export const LEVEL_1_SPEAKING: SpeakingTopic[] = [
  {
    id: 's-l1-001',
    title: 'Technology in Education',
    level: 'level-1',
    format: 'discussion',
    scenario: 'You are taking part in a formal group discussion about the role of technology in education.',
    openingPrompt: 'Some people believe that technology has improved education, while others think it has created new problems. What is your view? Please explain your reasoning.',
    followUpPrompts: [
      'Can you give a specific example of how technology has helped students learn more effectively?',
      'What are the risks of relying too heavily on technology in the classroom?',
      'Do you think online learning can ever fully replace face-to-face teaching? Why or why not?',
    ],
    assessmentFocus: [
      'Presenting a clear point of view with supporting evidence',
      'Engaging with counterarguments thoughtfully',
      'Using a range of vocabulary appropriate to the topic',
      'Structuring contributions logically and coherently',
      'Listening actively and building on what has been said',
    ],
    tasks: [
      {
        id: 'st-l1-001-01',
        instruction: 'Present your overall view on whether technology has improved education. Support your position with at least one piece of evidence or reasoning.',
        expectedDurationSec: 40,
        hint: 'Structure your answer: state your position first, then provide evidence such as a study, statistic, or well-known example.',
      },
      {
        id: 'st-l1-001-02',
        instruction: 'Give a specific example of a technology tool or platform that has benefited students. Explain how it helps and who benefits most.',
        expectedDurationSec: 40,
      },
      {
        id: 'st-l1-001-03',
        instruction: 'Discuss one significant risk or drawback of using technology in classrooms. Why should educators be cautious?',
        expectedDurationSec: 40,
        hint: 'Consider issues such as screen addiction, distraction, data privacy, or unequal access to devices.',
      },
      {
        id: 'st-l1-001-04',
        instruction: 'Compare the perspective of someone who fully supports digital learning with someone who prefers traditional methods. Where do they agree and disagree?',
        expectedDurationSec: 40,
      },
      {
        id: 'st-l1-001-05',
        instruction: 'State your final position on technology in education. Has your view changed during this discussion? Summarise the strongest argument on each side.',
        expectedDurationSec: 40,
      },
    ],
  },
  {
    id: 's-l1-002',
    title: 'Climate Change Responsibility',
    level: 'level-1',
    format: 'discussion',
    scenario: 'You are participating in a formal academic debate about who bears the greatest responsibility for addressing climate change.',
    openingPrompt: 'Who should take the most responsibility for tackling climate change — governments, businesses, or individuals? Explain your reasoning with examples.',
    followUpPrompts: [
      'Can you provide evidence that government policy is more effective than individual action?',
      'How do multinational corporations contribute to the problem, and what should they be doing differently?',
      'Is it fair to expect developing nations to follow the same environmental standards as wealthy countries?',
    ],
    assessmentFocus: [
      'Building an argument with relevant examples and evidence',
      'Addressing multiple perspectives fairly',
      'Using formal academic register consistently',
      'Structuring extended responses with clear cohesion',
      'Demonstrating critical thinking under discussion pressure',
    ],
    tasks: [
      {
        id: 'st-l1-002-01',
        instruction: 'Argue who should bear the primary responsibility for tackling climate change — governments, businesses, or individuals. Justify your choice with evidence.',
        expectedDurationSec: 40,
      },
      {
        id: 'st-l1-002-02',
        instruction: 'Describe a real-world example where government policy has successfully reduced carbon emissions. Explain what made it effective.',
        expectedDurationSec: 40,
        hint: 'You could mention the Paris Agreement, a carbon tax scheme, or a national renewable energy target.',
      },
      {
        id: 'st-l1-002-03',
        instruction: 'Explain the role of large corporations in climate change. Should they be legally required to reduce their environmental impact? Why or why not?',
        expectedDurationSec: 40,
      },
      {
        id: 'st-l1-002-04',
        instruction: 'Some argue that developing nations should not face the same emission targets as wealthy countries. Evaluate this claim and explain whether you agree.',
        expectedDurationSec: 40,
        hint: 'Consider historical emissions, economic capacity, and the principle of climate justice.',
      },
      {
        id: 'st-l1-002-05',
        instruction: 'Deliver a brief closing statement: summarise the key arguments discussed and state which single action you believe would have the greatest impact on climate change.',
        expectedDurationSec: 40,
      },
    ],
  },
]
