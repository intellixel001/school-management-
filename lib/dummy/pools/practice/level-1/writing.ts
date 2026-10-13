/**
 * Level 1 — Writing practice pool.
 * SHAPE:     WritingPrompt for IELTS Task 2 style essay (~250 words), 5-criterion marking grid.
 *            Phase 10a restructured: each prompt contains 5 atomic WritingTask items.
 * COMPLEXITY: Argumentative essay, formal register, 5 assessment criteria from Karani's marking form.
 * REFERENCE:  Karani's "Social Media" PDF and marking form.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 */
import type { WritingPrompt } from '@/types/platform'

export const LEVEL_1_WRITING: WritingPrompt[] = [
  {
    id: 'w-l1-001',
    title: 'The Impact of Social Media on Young People',
    level: 'level-1',
    type: 'article',
    prompt: `Some people believe that social media has a mostly negative impact on young people, while others argue that it offers significant benefits.\n\nWrite an essay discussing both sides of this argument. You should:\n• explain the potential negative effects of social media on young people\n• discuss the benefits that social media can offer\n• give your own opinion, supported by reasons and examples\n\nWrite approximately 250 words.`,
    audience: 'An examiner assessing Functional Skills Level 2 writing',
    purpose: 'To present a balanced argument and give a supported personal opinion',
    wordCountGuidance: 'Write approximately 250 words',
    criteria: [
      'Task Achievement: Address all parts of the prompt with relevant ideas and examples',
      'Organisation & Coherence: Structure the essay with clear paragraphs, logical flow, and effective use of linking words',
      'Lexical Resource: Use a range of vocabulary appropriate to the topic and register',
      'Grammar Range & Accuracy: Use a variety of sentence structures with accurate grammar, spelling, and punctuation',
      'Tone & Format: Maintain a formal, academic tone appropriate to the task and audience',
    ],
    tasks: [
      {
        id: 'wt-l1-001-01',
        instruction: 'Write an introductory paragraph that presents the debate around social media and young people. End with a clear thesis statement outlining your position.',
        minWords: 30,
        hint: 'Introduce the topic broadly, acknowledge both sides exist, then state whether you believe the impact is mostly positive, mostly negative, or mixed.',
      },
      {
        id: 'wt-l1-001-02',
        instruction: 'Write a paragraph discussing the negative effects of social media on young people. Include at least two distinct points supported by examples or evidence.',
        minWords: 40,
      },
      {
        id: 'wt-l1-001-03',
        instruction: 'Write a paragraph exploring the benefits that social media can offer young people. Provide specific examples to support each point.',
        minWords: 40,
        hint: 'Consider benefits such as access to educational resources, global connectivity, or platforms for creative expression.',
      },
      {
        id: 'wt-l1-001-04',
        instruction: 'Write a paragraph giving your own opinion on the issue. Support your view with at least one piece of evidence or a personal example.',
        minWords: 30,
      },
      {
        id: 'wt-l1-001-05',
        instruction: 'Write a concluding paragraph that summarises the key arguments and reinforces your overall position. Do not introduce new points.',
        minWords: 25,
        hint: 'A strong conclusion restates your thesis in different words and leaves the reader with a final thought.',
      },
    ],
  },
  {
    id: 'w-l1-002',
    title: 'Remote Working',
    level: 'level-1',
    type: 'article',
    prompt: `Since the COVID-19 pandemic, many companies have adopted remote working policies. Some believe this shift has been overwhelmingly positive, while others argue it creates new problems for employees and businesses.\n\nWrite an essay discussing the advantages and disadvantages of remote working. You should:\n• analyse the main advantages of working from home\n• examine the potential disadvantages and challenges\n• provide a balanced evaluation and your own conclusion\n\nWrite approximately 250 words.`,
    audience: 'An examiner assessing Functional Skills Level 2 writing',
    purpose: 'To evaluate both sides of a workplace debate and reach a reasoned conclusion',
    wordCountGuidance: 'Write approximately 250 words',
    criteria: [
      'Task Achievement: Address all parts of the prompt with relevant ideas and examples',
      'Organisation & Coherence: Structure the essay with clear paragraphs, logical flow, and effective use of linking words',
      'Lexical Resource: Use a range of vocabulary appropriate to the topic and register',
      'Grammar Range & Accuracy: Use a variety of sentence structures with accurate grammar, spelling, and punctuation',
      'Tone & Format: Maintain a formal, academic tone appropriate to the task and audience',
    ],
    tasks: [
      {
        id: 'wt-l1-002-01',
        instruction: 'Write an introductory paragraph that outlines the rise of remote working and presents a clear thesis statement on whether it is beneficial overall.',
        minWords: 30,
        hint: 'Provide brief context about the shift to remote work, then state your overall position clearly.',
      },
      {
        id: 'wt-l1-002-02',
        instruction: 'Write a paragraph analysing the main advantages of remote working. Discuss at least two benefits with supporting examples or reasoning.',
        minWords: 40,
      },
      {
        id: 'wt-l1-002-03',
        instruction: 'Write a paragraph examining the disadvantages and challenges of remote working. Include at least two distinct drawbacks with evidence.',
        minWords: 40,
        hint: 'Consider issues such as isolation, blurred work-life boundaries, or reduced team collaboration.',
      },
      {
        id: 'wt-l1-002-04',
        instruction: 'Write a paragraph providing a balanced evaluation. Weigh the advantages against the disadvantages and explain which side you find more convincing.',
        minWords: 30,
      },
      {
        id: 'wt-l1-002-05',
        instruction: 'Write a concluding paragraph that summarises your argument and offers a practical recommendation for employers or employees.',
        minWords: 25,
      },
    ],
  },
]
