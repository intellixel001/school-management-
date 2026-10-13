import type { WritingPrompt } from '@/types'

export const writingPrompts: WritingPrompt[] = [
  {
    id: 'w001',
    title: 'Formal Letter of Complaint',
    level: 'level-1',
    type: 'formal_letter',
    prompt: `You recently bought a new laptop from an electronics store. When it arrived, the screen was cracked and one of the keys was missing from the keyboard. You contacted the store's customer service team by phone two weeks ago but have not received a response.

Write a formal letter of complaint to the store manager. In your letter you should:
• describe the problem with the laptop
• explain what action you have already taken
• state clearly what you would like the store to do`,
    audience: 'The store manager of an electronics retailer',
    purpose: 'To complain formally and request a resolution',
    wordCountGuidance: 'Write between 150 and 200 words',
    criteria: [
      'Writing clearly and coherently for the purpose and audience',
      'Organising information logically using paragraphs',
      'Using formal language appropriate to the situation',
      'Using correct spelling, punctuation and grammar',
    ],
  },
  {
    id: 'w002',
    title: 'Article for a Community Newsletter',
    level: 'level-1',
    type: 'article',
    prompt: `Your local community centre has asked readers to submit articles for their monthly newsletter. This month's theme is: "How to improve wellbeing in our community."

Write an article for the newsletter. You could include:
• what wellbeing means and why it matters
• specific ideas for improving wellbeing locally
• how residents can get involved`,
    audience: 'Local community members of all ages reading the community newsletter',
    purpose: 'To inform and engage readers, and encourage community involvement',
    wordCountGuidance: 'Write between 200 and 250 words',
    criteria: [
      'Writing clearly and coherently for the purpose and audience',
      'Using an appropriate format and structure for an article (headline, paragraphs)',
      'Using language that is engaging and appropriate for a community audience',
      'Using correct spelling, punctuation and grammar',
    ],
  },
  {
    id: 'w003',
    title: 'Formal Email to an Employer',
    level: 'level-1',
    type: 'email',
    prompt: `You work as a customer service assistant at a supermarket. You have seen an internal notice about a new team leader position that has become available. You are interested in applying.

Write a formal email to your line manager, Ms. Patel, expressing your interest in the position. In your email you should:
• explain why you are interested in the team leader role
• describe two or three skills or experiences that make you suitable
• ask about the next steps in the application process`,
    audience: 'Your line manager in a professional workplace setting',
    purpose: 'To express interest in a promotion and present yourself professionally',
    wordCountGuidance: 'Write between 150 and 200 words',
    criteria: [
      'Writing clearly and coherently for the purpose and audience',
      'Using a correct formal email format (subject line, greeting, sign-off)',
      'Presenting yourself positively using formal and professional language',
      'Using correct spelling, punctuation and grammar',
    ],
  },
  {
    id: 'w004',
    title: 'Report on Training Needs',
    level: 'level-1',
    type: 'report',
    prompt: `You are a member of staff at a care home. Your manager has asked you to write a short report about the training needs of new staff members, based on your own experience joining the team.

Write a report for your manager. Your report should:
• identify two or three areas where new staff need more training or support
• explain why these areas are important
• suggest at least one recommendation for improvement`,
    audience: 'Your manager at the care home',
    purpose: 'To inform and make recommendations in a professional setting',
    wordCountGuidance: 'Write between 150 and 200 words',
    criteria: [
      'Writing clearly and coherently for the purpose and audience',
      'Using an appropriate report format (headings, sections)',
      'Presenting information and recommendations clearly and logically',
      'Using correct spelling, punctuation and grammar',
    ],
  },
]

/** @deprecated Use writingPrompts instead */
export const writingTasks = writingPrompts

export function getWritingTask(id: string): WritingPrompt | undefined {
  return writingPrompts.find((t) => t.id === id)
}

export function getRandomWritingTask(): WritingPrompt {
  return writingPrompts[Math.floor(Math.random() * writingPrompts.length)]
}
