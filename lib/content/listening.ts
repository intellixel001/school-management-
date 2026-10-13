import type { ListeningPassage } from '@/types'

export const listeningPassages: ListeningPassage[] = [
  {
    id: 'l001',
    title: 'Community Centre Announcement',
    level: 'level-1',
    type: 'announcement',
    passage: `Good morning, everyone, and welcome to Millbrook Community Centre. Before we begin today's activities, I have a few important announcements to share with you.

Firstly, please be aware that the car park on the north side of the building will be closed for resurfacing work from Monday the fourteenth until Friday the eighteenth. During this time, alternative parking is available at the council-owned car park on Bridge Street, which is approximately a five-minute walk from here. We apologise for any inconvenience this may cause.

Secondly, our popular Tuesday evening English conversation class is expanding from next month. We will be adding a second session on Thursday evenings, starting at six-thirty. Places are limited, so if you are interested, please speak to a member of staff at the front desk today to reserve your place.

Finally, a reminder that the centre will be closed on the Bank Holiday Monday at the end of this month. Our normal opening hours will resume the following day. If you have any questions about any of these announcements, please do not hesitate to ask one of our team members. Thank you, and enjoy your time with us today.`,
    questions: [
      {
        id: 'l001_q1',
        type: 'open',
        question: 'Why will the north car park be closed from the fourteenth?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l001_q2',
        type: 'open',
        question: 'Where can people park while the main car park is closed?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l001_q3',
        type: 'open',
        question: 'What is changing about the Tuesday evening English class from next month?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l001_q4',
        type: 'open',
        question: 'What should people do if they want to join the new Thursday class?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l001_q5',
        type: 'open',
        question: 'What is the overall purpose of this announcement?',
        marks: 1,
        criterion: 'Identify purpose and main idea',
      },
    ],
  },
  {
    id: 'l002',
    title: 'Talk: Getting the Most from Your Library',
    level: 'level-1',
    type: 'talk',
    passage: `Thank you all for coming along today. My name is David, and I'm the head librarian here at Thornfield Public Library. I'm delighted to have the chance to tell you about everything we offer — because I think many people don't realise just how much a modern library can do for you.

Most people know that you can borrow books here, but did you know that you can also borrow e-books, audiobooks, and DVDs? All of these are available free of charge to anyone with a library card. Getting a card is simple — you just need proof of your address and a form of identification.

Beyond borrowing, we run a wide range of free events throughout the year. These include children's story sessions every Saturday morning, a monthly book club for adults, and fortnightly drop-in sessions where you can get help with things like using a computer, filling in forms, or writing a CV.

We also have a quiet study space with free Wi-Fi, which is very popular with students and people who work from home. The space is available during all opening hours — Monday to Friday, nine until seven, and Saturday, nine until five.

If there is a specific book or resource you need that we don't currently have, you can request it through our inter-library loan service, and we will do our best to get it for you within two weeks.

I hope that gives you a flavour of what's on offer. Please do explore, ask questions, and make the most of everything this library has to provide.`,
    questions: [
      {
        id: 'l002_q1',
        type: 'open',
        question: 'What three types of media can you borrow from the library, besides printed books?',
        marks: 3,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l002_q2',
        type: 'open',
        question: 'What do you need to get a library card?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l002_q3',
        type: 'open',
        question: 'What can people get help with at the fortnightly drop-in sessions? Give two examples.',
        marks: 2,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l002_q4',
        type: 'open',
        question: 'What are the library\'s opening hours on Saturdays?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l002_q5',
        type: 'open',
        question: 'What is the purpose of the inter-library loan service?',
        marks: 1,
        criterion: 'Identify purpose and main idea',
      },
    ],
  },
  {
    id: 'l003',
    title: 'News Report: Local Business Award',
    level: 'level-1',
    type: 'news_report',
    passage: `And now to some positive news for our local business community. Ferndale Bakery, a family-run business on the High Street, has been named the Small Business of the Year at last night's Regional Enterprise Awards — a ceremony held annually to recognise outstanding achievement in the local economy.

The bakery, which was founded by sisters Amara and Zainab Osei just four years ago, began as a small market stall selling traditional West African pastries. Today, the business employs twelve members of staff and supplies products to six local cafés and two schools in the borough.

Speaking at the ceremony, Amara Osei said she was overwhelmed by the recognition. "We started this business because we wanted to share our culture and our love of food," she said. "We never imagined it would grow so quickly, and we are incredibly grateful to our customers and our wonderful team."

The judges praised the bakery for its innovation, its commitment to using locally sourced ingredients, and its contribution to the community, which includes running free baking workshops for young people during school holidays.

The Small Business of the Year award comes with a five-thousand-pound grant, which the Osei sisters say they plan to use to expand their kitchen facilities and take on two more apprentices later this year.`,
    questions: [
      {
        id: 'l003_q1',
        type: 'open',
        question: 'What award did Ferndale Bakery win?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l003_q2',
        type: 'open',
        question: 'How did the business begin four years ago?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l003_q3',
        type: 'open',
        question: 'What two things does the bakery supply to, besides its own shop?',
        marks: 2,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l003_q4',
        type: 'open',
        question: 'What three things did the judges praise the bakery for?',
        marks: 3,
        criterion: 'Identify and retrieve information',
      },
      {
        id: 'l003_q5',
        type: 'open',
        question: 'What do the Osei sisters plan to do with the prize money?',
        marks: 1,
        criterion: 'Identify and retrieve information',
      },
    ],
  },
]

export function getListeningPassage(id: string): ListeningPassage | undefined {
  return listeningPassages.find((p) => p.id === id)
}

export function getRandomListeningPassage(): ListeningPassage {
  return listeningPassages[Math.floor(Math.random() * listeningPassages.length)]
}
