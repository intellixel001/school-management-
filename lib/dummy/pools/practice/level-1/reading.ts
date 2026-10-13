/**
 * Level 1 — Reading practice pool.
 * SHAPE:     ReadingPassage with full IELTS-style passage (~700 words), T/F/NG + short answer (≤3 words).
 * COMPLEXITY: Multi-paragraph argumentative/expository text, academic register, 5 questions.
 * REFERENCE:  Karani's "Childhood in Western Countries" PDF.
 * TARGET:    ~30 entries; Phase 3 ships 1; backfill downstream.
 * NOTE:      Question count normalised to 5 per passage in Phase 10a.
 */
import type { ReadingPassage } from '@/types/platform'

export const LEVEL_1_READING: ReadingPassage[] = [
  {
    id: 'r-l1-001',
    title: 'The Changing Nature of Work',
    level: 'level-1',
    type: 'article',
    text: `The nature of work has undergone a profound transformation over the past century. In the early 1900s, the majority of people in Western countries were employed in agriculture or manufacturing — physical labour that demanded long hours and offered limited job security. Today, by contrast, the service sector dominates most advanced economies, and knowledge-based roles in technology, finance, and healthcare have become the primary drivers of employment growth.\n\nOne of the most significant changes has been the rise of flexible working. The traditional model of a nine-to-five job, performed five days a week in a fixed office location, is increasingly being replaced by arrangements that allow employees to work remotely, adjust their hours, or share roles with colleagues. Proponents argue that flexible working improves productivity, reduces commuting time, and enables workers to achieve a better balance between their professional and personal lives. Critics, however, warn that it can blur the boundary between work and home, leading to longer working hours and increased stress.\n\nTechnology has been the catalyst for much of this change. The widespread adoption of high-speed internet, cloud computing, and collaborative software tools has made it possible for many jobs to be performed from virtually anywhere in the world. Video conferencing platforms, which saw explosive growth during the COVID-19 pandemic, have become a standard feature of corporate life. Some commentators have gone so far as to suggest that the physical office may eventually become obsolete — though this view remains contentious.\n\nAnother major trend is the growth of the so-called "gig economy." Rather than holding a single permanent position, a growing number of workers now earn their living through short-term contracts, freelance assignments, or platform-based work such as ride-sharing and food delivery. This model offers considerable flexibility and autonomy, but it also raises serious questions about workers\' rights, job security, and access to benefits such as pensions and sick pay.\n\nThe impact of automation and artificial intelligence on the labour market is perhaps the most hotly debated issue of all. Some economists predict that millions of jobs currently performed by humans will be automated within the next two decades, particularly in sectors such as transportation, retail, and administrative support. Others are more optimistic, arguing that while some roles will disappear, new ones will be created — many of which we cannot yet imagine. History offers some support for this view: the Industrial Revolution, for example, destroyed many traditional crafts but ultimately created far more jobs than it eliminated.\n\nWhat is clear is that the skills required to succeed in the modern workplace are changing rapidly. Employers increasingly value adaptability, digital literacy, and the ability to work collaboratively across cultures and time zones. Lifelong learning — the continuous updating of one\'s skills and knowledge throughout a career — is no longer a luxury but a necessity. Governments, educational institutions, and businesses all have a role to play in ensuring that workers are equipped for the challenges ahead.\n\nIn conclusion, the world of work is in a state of rapid and ongoing change. While the opportunities are enormous, so too are the risks. Navigating this transition successfully will require thoughtful policy, investment in education, and a willingness on the part of individuals to embrace change and continuously develop their capabilities.`,
    questions: [
      {
        id: 'r-l1-001_q1',
        type: 'mcq',
        question: 'In the early 1900s, most people in Western countries worked in the service sector.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 'False',
      },
      {
        id: 'r-l1-001_q2',
        type: 'mcq',
        question: 'Flexible working always leads to higher productivity.',
        options: ['True', 'False', 'Not Given'],
        correctAnswer: 'Not Given',
      },
      {
        id: 'r-l1-001_q3',
        type: 'open',
        question: 'What technology saw "explosive growth" during the COVID-19 pandemic? (Answer in 3 words or fewer)',
        correctAnswer: 'Video conferencing platforms',
      },
      {
        id: 'r-l1-001_q4',
        type: 'open',
        question: 'Name two concerns raised about the gig economy in the passage.',
        correctAnswer: 'Workers\' rights, job security, or access to benefits',
      },
      {
        id: 'r-l1-001_q5',
        type: 'open',
        question: 'What point is the writer making by referencing the Industrial Revolution?',
        correctAnswer: 'That technological change ultimately creates more jobs than it destroys',
      },
    ],
  },
]
