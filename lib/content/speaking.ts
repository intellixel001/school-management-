import type { SpeakingTopic } from '@/types'

export const speakingTopics: SpeakingTopic[] = [
  {
    id: 's001',
    title: 'The Importance of Learning New Skills',
    level: 'level-1',
    format: 'discussion',
    scenario: 'You are taking part in a group discussion about whether adults should continue learning new skills throughout their working lives.',
    openingPrompt: "Let's discuss the importance of learning new skills as an adult. Do you think it's important for people to keep learning new skills throughout their working lives? Why, or why not?",
    followUpPrompts: [
      'Can you give me an example of a skill you have learned recently, or one you would like to learn?',
      'Some people say that employers should pay for their staff to learn new skills. Do you agree?',
      'What challenges might people face when trying to learn something new alongside work and family life?',
      'How do you think technology has changed the way people learn new skills?',
    ],
    assessmentFocus: [
      'Expressing and explaining opinions clearly',
      'Supporting points with reasons or examples',
      'Using formal and appropriate language',
      'Listening and responding to questions',
      'Maintaining a coherent and structured contribution',
    ],
  },
  {
    id: 's002',
    title: 'Health and Lifestyle Choices',
    level: 'level-1',
    format: 'discussion',
    scenario: 'You are taking part in a group discussion about how lifestyle choices affect health and wellbeing.',
    openingPrompt: "Today we're going to discuss health and lifestyle. In your opinion, what is the single most important thing a person can do to stay healthy? Please explain your reasoning.",
    followUpPrompts: [
      'Some people believe the government should do more to encourage healthy eating. What do you think?',
      'Do you think it is harder to live a healthy lifestyle today than it was for previous generations? Why?',
      'How important is mental health compared to physical health, in your view?',
      'What role should schools play in teaching young people about healthy living?',
    ],
    assessmentFocus: [
      'Expressing and explaining opinions clearly',
      'Supporting points with reasons or examples',
      'Using formal and appropriate language',
      'Listening and responding to questions',
      'Adapting contributions to the direction of the discussion',
    ],
  },
  {
    id: 's003',
    title: 'The Environment and Individual Responsibility',
    level: 'level-1',
    format: 'discussion',
    scenario: 'You are taking part in a formal discussion about environmental issues and what individuals can do to help.',
    openingPrompt: "We're going to discuss the environment. Do you think individuals have a responsibility to change their behaviour to help protect the environment, or is it mainly the responsibility of governments and businesses?",
    followUpPrompts: [
      'What changes have you personally made, or considered making, to reduce your impact on the environment?',
      'Some people say that small individual actions make no real difference. How would you respond to that argument?',
      'Do you think it is fair that poorer people often find it harder to make environmentally friendly choices? Why?',
      'What is the most effective action that could be taken to tackle climate change, in your opinion?',
    ],
    assessmentFocus: [
      'Presenting a clear point of view with supporting evidence',
      'Engaging with counterarguments thoughtfully',
      'Using a range of vocabulary appropriate to the topic',
      'Structuring contributions logically',
      'Listening actively and building on what has been said',
    ],
  },
  {
    id: 's004',
    title: 'Work and Career Development',
    level: 'level-1',
    format: 'discussion',
    scenario: 'You are taking part in a group discussion about careers, job satisfaction, and the changing nature of work.',
    openingPrompt: "Let's talk about work and careers. What do you think is more important in a job — a high salary, or job satisfaction? Can you explain your answer?",
    followUpPrompts: [
      'Do you think most people end up in careers that suit them, or do many people settle for less than they hoped for?',
      'How has the idea of a "job for life" changed over the last generation, in your view?',
      'What advice would you give to a young person just starting to think about their career?',
      'Some people change careers completely in their 40s or 50s. What do you think drives that decision?',
    ],
    assessmentFocus: [
      'Expressing opinions with confidence and clarity',
      'Giving relevant examples from personal experience or wider knowledge',
      'Using formal language appropriate to a professional discussion',
      'Listening carefully and responding to follow-up questions',
      'Keeping contributions focused and on-topic',
    ],
  },
]

export function getSpeakingTopic(id: string): SpeakingTopic | undefined {
  return speakingTopics.find((t) => t.id === id)
}

export function getRandomSpeakingTopic(): SpeakingTopic {
  return speakingTopics[Math.floor(Math.random() * speakingTopics.length)]
}
