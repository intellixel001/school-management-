import type { MockExam, MockSectionAttempt } from '@/types/platform'

export const DUMMY_MOCK_EXAMS: MockExam[] = [
  {
    id: 'mock-1',
    number: 1,
    title: 'Mock Test 1',
    status: 'active',
    reading: {
      id: 'mock-1-reading',
      passageTitle: 'The Concept of Childhood in Western Countries',
      passageText: `The history of childhood has been a topic of interest in social history since the highly influential 1960 book Centuries of Childhood, written by French historian Philippe Aries. He argued that "childhood" is a concept created by modern society.
One of the most hotly debated issues in the history of childhood has been whether childhood is itself a recent invention. The historian Philippe Aries argued that in Western Europe during the Middle Ages (up to about the end of the fifteenth century) children were regarded as miniature adults, with all the intellect and personality that this implies. He scrutinized medieval pictures of children, finding that they were depicted as adults with mature faces and identical clothing. He argued that childhood was not a known phenomenon, implying that children were not valued or loved as they are today. However, many historians have disagreed with Aries. They point out that from the Middle Ages to the eighteenth and nineteenth centuries, child labor was common, and children often worked long hours in agriculture or trades. But this did not mean they were unloved.
The industrialisation of Europe in the 18th and 19th centuries led to a great demand for labor, and many children were put to work in factories and mines. However, concerns about the welfare of working children began to grow. Some scientists and social reformers argued that overwork could damage the physical and mental health of young children. This led to the passing of various Factory Acts in Britain in the 1800s, which aimed to protect children from exploitation by limiting their working hours and improving their working conditions. Trade unions also played a part, although their influence on child labor specifically is debated.
By the mid-19th century, the idea that children should be educated rather than working began to gain traction. The introduction of half-time schools allowed some children to work and attend school, but it wasn't until the late 19th and early 20th centuries that full-time education became compulsory for almost all children. This shift marked a significant change in the perception of childhood, viewing it as a time for play and education rather than work. In schools, children spent the majority of their time in the classroom.
Today, the needs of children are highly differentiated and categorised based on their age, reflecting a complex and nuanced understanding of childhood development.`,
      questions: [
        { id: 'q1', type: 'true-false-not-given', question: 'Aries pointed out that children did different types of work to adults during the Middle Ages.', correctAnswer: 'FALSE' },
        { id: 'q2', type: 'true-false-not-given', question: 'Working children during the Middle Ages were generally unloved.', correctAnswer: 'FALSE' },
        { id: 'q3', type: 'true-false-not-given', question: 'Some scientists thought that overwork might damage the health of young children.', correctAnswer: 'TRUE' },
        { id: 'q4', type: 'true-false-not-given', question: 'The rise of trade unions majorly contributed to the protection of children from exploitation in the 19th century.', correctAnswer: 'NOT GIVEN' },
        { id: 'q5', type: 'true-false-not-given', question: 'The aid of half-time schools, most children went to school in the mid-19th century.', correctAnswer: 'FALSE' },
        { id: 'q6', type: 'true-false-not-given', question: 'The 20th century, almost all children needed to go to school with a full-time schedule.', correctAnswer: 'TRUE' },
        { id: 'q7', type: 'true-false-not-given', question: 'Nowadays, children\'s needs are much differentiated and categorised based on how old they are.', correctAnswer: 'TRUE' },
        { id: 'q8', type: 'short-answer', question: 'What had not become a hot topic until the French historian Philippe Aries\' book caused great attention?', correctAnswer: 'history of childhood', maxWords: 3 },
        { id: 'q9', type: 'short-answer', question: 'According to Aries, what was the typical image of children in Western Europe during the Middle Ages?', correctAnswer: 'miniature adults', maxWords: 3 },
        { id: 'q10', type: 'short-answer', question: 'What historical event generated the need for a large number of children to work for a long time in the 18th and 19th centuries?', correctAnswer: 'industrialisation', maxWords: 3 },
        { id: 'q11', type: 'short-answer', question: 'What bill was enacted to protect children from exploitation in Britain in the 1800s?', correctAnswer: 'Factory Act', maxWords: 3 },
        { id: 'q12', type: 'short-answer', question: 'Which activities were becoming regarded as preferable for almost all children in the 19th century?', correctAnswer: 'play and education', maxWords: 3 },
        { id: 'q13', type: 'short-answer', question: 'In what place did children spend the majority of time during their day in school?', correctAnswer: 'classroom', maxWords: 3 }
      ],
      durationMinutes: 30
    },
    listening: {
      id: 'mock-1-listening',
      recordings: [
        {
          id: 'rec1',
          title: 'Section 1 · Housing Enquiry Voicemail',
          audioScript: `Hello Anya, this is Charlotte calling from Nelson College Housing Office. I'm just returning your enquiry from earlier today. I'm sorry I've missed you, but I wanted to leave a message to confirm the details you submitted and let you know what happens next.

So, to run through what you sent us. Your course is the Adult ESOL programme, Level 1, which starts next month. Please do get in touch if you're actually applying for a different course, because we assign accommodation based on course length.

You indicated that you'd like a single studio rather than a shared flat or a homestay, and your maximum budget is two hundred pounds per week. Two hundred is a little tight for a studio in central London, but we do have several options in Stratford and Wembley from around one hundred and eighty pounds a week, so I'll shortlist those for you.

Your preferred move-in date is the fifth of March, which gives you a week to settle before your course begins. That's perfectly fine — most of our studios are available from the first of the month, so we can hold one for you from the fifth.

You'd like the room for a minimum of nine months, with a possible extension if you continue to Level 2. I've noted that on your file — we can renew month-to-month after your initial contract ends.

You said you don't want to travel more than forty minutes to campus by public transport, and I completely understand — the commute really matters. Every studio on your shortlist will be within that limit.

For special requirements, you specified a vegetarian kitchen. That's less common, but we do have two properties in Islington that specifically cater to that — they'll both be on your shortlist.

You mentioned that you'd like to live near Bethnal Green station, as you have a friend nearby. Bethnal Green is a lovely area with excellent transport links, so that's great.

For your reference contact, you've given us the name of your previous landlord in Warsaw, Mr Marek Kowalski. I'll email a short reference form directly to him this afternoon — no action needed from you.

And finally, on the deposit. The standard is six weeks' rent, but as a student you qualify for our reduced deposit scheme, which is a flat five hundred pounds, fully refundable at the end of your tenancy.

I'll email your shortlist of studios by tomorrow afternoon. If any of the details I've just read back are incorrect, please call the office on the number below and ask for me — Charlotte — and I'll amend your file.

Thank you, Anya, and welcome to Nelson College London. Speak soon.`,
          questionRange: { from: 1, to: 10 },
          estimatedDurationSec: 190
        },
        {
          id: 'rec2',
          title: 'Section 2 · Campus Orientation Tour',
          audioScript: `Good morning, everyone, and welcome to Nelson College London. I'm George, one of the student advisors, and I'll be showing you around our campus today. Before we start the walk, let me give you a quick overview so you can find your way around during your first few weeks.

We have five main buildings on campus. To your right, that Georgian-style building is Hardwick House — that's where you'll find the main reception, the Registrar's office, and student services. If you ever need to sort out enrolment paperwork, fee payments, or your student ID card, this is the building to visit.

Directly opposite, across the courtyard, is the Whitfield Building — our newest addition, completed in 2024. It's a modern glass structure and it houses the library, computer suites on the upper floors, and a large open-plan study lounge on the ground floor. The library has extended opening hours during exam periods — from seven in the morning until eleven at night — but during normal term it's open eight to eight.

Now, to the north side of the courtyard is Rowan Hall. This is primarily a teaching building — most of your ESOL classrooms will be here, on floors one and two. Rowan also has the media studios on the top floor, so if you're doing any presentations or filming projects, you'll spend time there.

Behind Rowan is a smaller building called Ashwood. Ashwood is where the language labs are — headphones, screens, all set up for listening practice. It also has quiet study zones on the lower ground floor. If you want somewhere with no distractions to prepare for a test, Ashwood is where I'd send you.

Finally, across the road you'll see the sports centre. It's officially called the Kensington Sports Complex, but everyone just calls it the KSC. It has a gym, two squash courts, a swimming pool, and a small café. Membership is free for enrolled students — you just need to activate it online first, then confirm at KSC reception with your student ID.

Now a few quick practical points. The main refectory, which is our student cafeteria, is on the ground floor of Hardwick House. It opens at seven-thirty in the morning and serves hot meals until three in the afternoon. There's also a small coffee kiosk in Whitfield that stays open till six.

For your welcome pack collection, please head to student services in Hardwick House this afternoon between two and four. Your welcome pack contains your ID card, your term timetable, a bus pass, and a discount voucher for the campus bookshop.

One important thing: printing. The main printing hub is on the second floor of Whitfield — all the multifunction machines are there. There is a smaller print station in Rowan reception for emergencies, but the queue can be long.

Right, that's the overview. Any questions before we start the walking tour?`,
          questionRange: { from: 11, to: 20 },
          estimatedDurationSec: 195
        },
        {
          id: 'rec3',
          title: 'Section 3 · Student Project Pitch',
          audioScript: `Hi everyone, I'm Priya, and today I'm going to give you a quick update on the group project that Ben and I are working on. Our topic is the history of London transport.

Let me start with why we chose this topic. Honestly, we had a long list of options, but two things pulled us toward transport history in particular. The first reason was that there's so much material available — the London Transport Museum has a huge online archive, which makes the research much easier than for some of the other topics on the list. The second reason was that it connects to everyday life in London. You can literally see the history around you every day — the old Tube stations, the double-decker buses. It felt real to us, not abstract.

We did briefly consider music history, but neither of us has any musical background, so we would have been out of our depth.

Now, in terms of how it's going. I want to be honest — we've hit a couple of difficulties. The biggest issue has been finding time to meet. Ben works evenings, I have classes till six, so we can really only meet on weekends. On top of that, we're struggling with the sheer amount of source material. We've got so many sources, we don't quite know what to include and what to leave out. The workload itself isn't the problem — it's more about focus.

Our main argument, our thesis, is that the London Underground fundamentally shaped the social geography of the city. Where people chose to live, where they worked, even where they socialised — all of it was influenced by where the Tube went, and where it didn't.

To keep things manageable, we've divided the work by historical era. I'm covering the Victorian period through to about 1930, and Ben is taking 1930 onwards to the present day.

For the final format, we've decided to make a video, actually — not a written report. We'll film some footage at real Tube stations and edit it together with archive images. We can borrow cameras from the media studios in Rowan, so equipment isn't an issue.

Our audience is mostly other Level 1 and Level 2 students, so we're keeping the language accessible — no historical jargon, no assumptions about prior knowledge.

I met with our tutor last week for a check-in, and he asked what would be most helpful from him at this stage. I told him that structural feedback would be most useful for us right now. We've done a lot of the content research, we just need help organising it into a coherent argument. He's going to read our outline over the weekend.

Our target date for the first draft of the video is the end of next month. That gives us six weeks to finish researching, three weeks to write the script, and three weeks to film and edit.

Thanks for listening — happy to take questions at the end.`,
          questionRange: { from: 1, to: 10 },
          estimatedDurationSec: 210
        },
        {
          id: 'rec4',
          title: 'Section 4 · Lecture: The UK\'s Changing High Streets',
          audioScript: `Good afternoon, everyone. Today's lecture is on a topic that affects every town and city in the UK — the changing nature of our high streets. When we talk about "the high street," we mean the main shopping street of a town, and for the last hundred years or so, this has been the commercial heart of British life. But in the last two decades, that role has been challenged, and today I want to explore how and why.

Let me start with a bit of history. The traditional British high street took its modern form in the Victorian era. Rising incomes and better transport meant that ordinary people could shop for more than just food. By the 1890s, a typical high street contained a butcher, a baker, a grocer, a tailor, and a chemist — the classic small independent shops.

The twentieth century brought two major changes. The first was the rise of chain stores, particularly after the Second World War. Marks and Spencer, Boots, and Woolworths began to dominate, gradually replacing many independents. The second change came in the 1980s, with the arrival of out-of-town shopping centres. Suddenly people could park easily and shop under one roof, and footfall in traditional high streets began a slow decline.

But the biggest disruption was still to come. The single most significant factor of the last twenty years has been, without question, the growth of online shopping. According to a recent industry report, online retail now accounts for around thirty percent of all UK retail spending — up from just two percent in 2001. This shift has been especially painful for shops selling books, music, and clothing, where price comparison online is easiest.

The Covid pandemic in 2020 accelerated everything. In just three months, high street footfall dropped by sixty percent. Some chains that were already struggling — think Debenhams, Topshop, Arcadia — collapsed permanently. By the end of 2022, one in seven high street shops was standing empty.

So what does the future look like? Interestingly, the picture isn't as gloomy as some predict. The most successful high streets today are those that have reinvented themselves. Instead of competing with online retail on convenience — a battle they cannot win — they're focusing on what online cannot offer: experience.

The most common transformation is the shift toward hospitality. Cafés, restaurants, and gyms now occupy many former retail units. In some market towns, food and drink venues make up over forty percent of high street businesses.

A second trend is the rise of what planners call "community hubs." These are spaces that combine multiple functions — a library, a coffee shop, a co-working area, sometimes even a small cinema, all under one roof. The idea is that people come for one reason and stay for others.

A third trend, particularly in areas with strong local identity, is a return to independents. Craft bakeries, artisan food shops, and small breweries are opening in premises that chain stores have vacated.

Finally, government policy has played a role. Business rates — the tax paid by shop owners — have been reformed several times, giving small businesses more relief. And a scheme called the High Street Fund has provided grants for renovation and redevelopment.

To summarise: the British high street is not dying, but it is changing. The successful high streets of the future will be places to experience, not just places to shop.`,
          questionRange: { from: 11, to: 20 },
          estimatedDurationSec: 240
        }
      ],
      formContexts: [
        {
          id: 'housing-form',
          title: 'Nelson College Housing — Enquiry Confirmation',
          format: 'form',
          elements: [
            { type: 'heading', text: 'Student details' },
            { type: 'label', text: 'Name: Anya Petrova' },
            { type: 'label', text: 'Course / Programme: ' },
            { type: 'blank', questionId: 's1q1' },
            { type: 'label', text: 'Preferred room type: ' },
            { type: 'blank', questionId: 's1q2' },

            { type: 'heading', text: 'Budget & timing' },
            { type: 'label', text: 'Maximum weekly budget: £' },
            { type: 'blank', questionId: 's1q3' },
            { type: 'label', text: 'Preferred move-in date: ' },
            { type: 'blank', questionId: 's1q4' },
            { type: 'label', text: 'Minimum duration: ' },
            { type: 'blank', questionId: 's1q5' },

            { type: 'heading', text: 'Location preferences' },
            { type: 'label', text: 'Maximum travel to campus: ' },
            { type: 'blank', questionId: 's1q6' },
            { type: 'label', text: 'Preferred tube station: ' },
            { type: 'blank', questionId: 's1q8' },

            { type: 'heading', text: 'Requirements' },
            { type: 'label', text: 'Special requirement: ' },
            { type: 'blank', questionId: 's1q7' },

            { type: 'heading', text: 'References & deposit' },
            { type: 'label', text: 'Reference contact (previous landlord): ' },
            { type: 'blank', questionId: 's1q9' },
            { type: 'label', text: 'Reduced student deposit: £' },
            { type: 'blank', questionId: 's1q10' }
          ]
        },
        {
          id: 'highstreets-notes',
          title: 'The Future of UK High Streets',
          format: 'bullet-list',
          elements: [
            { type: 'heading', text: 'Historical background' },
            { type: 'label', text: '• Modern high street took shape in the ' },
            { type: 'blank', questionId: 's4q1' },
            { type: 'label', text: ' era' },
            { type: 'label', text: '• Typical Victorian shops: butcher, baker, grocer, tailor, and a ' },
            { type: 'blank', questionId: 's4q2' },

            { type: 'heading', text: 'Key 20th-century changes' },
            { type: 'label', text: '• Rise of ' },
            { type: 'blank', questionId: 's4q3' },
            { type: 'label', text: ' stores after the Second World War' },
            { type: 'label', text: '• Out-of-town shopping centres arrived in the ' },
            { type: 'blank', questionId: 's4q4' },

            { type: 'heading', text: 'Impact of online shopping' },
            { type: 'label', text: '• Online now accounts for ' },
            { type: 'blank', questionId: 's4q5' },
            { type: 'label', text: '% of UK retail spending' },
            { type: 'label', text: '• Especially painful for shops selling books, music, and ' },
            { type: 'blank', questionId: 's4q6' },

            { type: 'heading', text: 'Effect of the Covid pandemic' },
            { type: 'label', text: '• High street footfall fell by 60% in just ' },
            { type: 'blank', questionId: 's4q7' },
            { type: 'label', text: ' months' },

            { type: 'heading', text: 'Modern trends' },
            { type: 'label', text: '• Shift toward ' },
            { type: 'blank', questionId: 's4q8' },
            { type: 'label', text: ' — cafés, restaurants, gyms' },
            { type: 'label', text: '• Rise of "community hubs" combining library, coffee shop, and ' },
            { type: 'blank', questionId: 's4q9' },
            { type: 'label', text: ' area' },
            { type: 'label', text: '• Government scheme: the High Street ' },
            { type: 'blank', questionId: 's4q10' },
            { type: 'label', text: ' provides grants for renovation' }
          ]
        }
      ],
      questions: [
        // ── SECTION 1 · Housing voicemail (Q1-10 form-fill) ─────────────
        { id: 's1q1',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Course / Programme',        correctAnswer: 'Adult ESOL',       maxWords: 3 },
        { id: 's1q2',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Preferred room type',      correctAnswer: 'single studio',    maxWords: 2 },
        { id: 's1q3',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Maximum weekly budget £',  correctAnswer: '200',              maxWords: 1 },
        { id: 's1q4',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Preferred move-in date',   correctAnswer: '5th March',        maxWords: 2 },
        { id: 's1q5',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Minimum duration',         correctAnswer: '9 months',         maxWords: 2 },
        { id: 's1q6',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Maximum travel to campus', correctAnswer: '40 minutes',       maxWords: 2 },
        { id: 's1q7',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Special requirement',      correctAnswer: 'vegetarian kitchen', maxWords: 2 },
        { id: 's1q8',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Preferred tube station',   correctAnswer: 'Bethnal Green',    maxWords: 2 },
        { id: 's1q9',  recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Reference contact',        correctAnswer: 'Marek Kowalski',   maxWords: 2 },
        { id: 's1q10', recordingId: 'rec1', type: 'notes-form-fill', question: '', formContextId: 'housing-form', label: 'Reduced student deposit £', correctAnswer: '500',             maxWords: 1 },

        // ── SECTION 2 · Campus tour (Q11-14 mcq-single, Q15-20 matching) ─────
        { id: 's2q1', recordingId: 'rec2', type: 'mcq-single', question: 'How many main buildings does the campus have?',
          options: ['Four', 'Five', 'Six'], correctAnswer: 'B' },
        { id: 's2q2', recordingId: 'rec2', type: 'mcq-single', question: 'When was the Whitfield Building completed?',
          options: ['2020', '2022', '2024'], correctAnswer: 'C' },
        { id: 's2q3', recordingId: 'rec2', type: 'mcq-single', question: "What are the library's opening hours during normal term?",
          options: ['Seven a.m. to eleven p.m.', 'Eight a.m. to eight p.m.', 'Nine a.m. to nine p.m.'], correctAnswer: 'B' },
        { id: 's2q4', recordingId: 'rec2', type: 'mcq-single', question: 'How do students activate their sports centre membership?',
          options: ['Pay a fee at KSC reception', 'Activate online, then confirm at KSC with student ID', 'Sign up during the campus tour'], correctAnswer: 'B' },

        { id: 's2q5',  recordingId: 'rec2', type: 'matching', question: 'Student services and ID cards',
          matchingOptions: ['Hardwick House', 'Whitfield Building', 'Rowan Hall', 'Ashwood', 'Kensington Sports Complex (KSC)'], correctAnswer: 'A' },
        { id: 's2q6',  recordingId: 'rec2', type: 'matching', question: 'Main library and computer suites',
          matchingOptions: ['Hardwick House', 'Whitfield Building', 'Rowan Hall', 'Ashwood', 'Kensington Sports Complex (KSC)'], correctAnswer: 'B' },
        { id: 's2q7',  recordingId: 'rec2', type: 'matching', question: 'Media studios on the top floor',
          matchingOptions: ['Hardwick House', 'Whitfield Building', 'Rowan Hall', 'Ashwood', 'Kensington Sports Complex (KSC)'], correctAnswer: 'C' },
        { id: 's2q8',  recordingId: 'rec2', type: 'matching', question: 'Language labs with headphones',
          matchingOptions: ['Hardwick House', 'Whitfield Building', 'Rowan Hall', 'Ashwood', 'Kensington Sports Complex (KSC)'], correctAnswer: 'D' },
        { id: 's2q9',  recordingId: 'rec2', type: 'matching', question: 'Swimming pool and squash courts',
          matchingOptions: ['Hardwick House', 'Whitfield Building', 'Rowan Hall', 'Ashwood', 'Kensington Sports Complex (KSC)'], correctAnswer: 'E' },
        { id: 's2q10', recordingId: 'rec2', type: 'matching', question: 'Main printing hub',
          matchingOptions: ['Hardwick House', 'Whitfield Building', 'Rowan Hall', 'Ashwood', 'Kensington Sports Complex (KSC)'], correctAnswer: 'B' },

        // ── SECTION 3 · Project pitch (Q1-4 mcq-multi, Q5-10 mcq-single) ─────
        { id: 's3q1', recordingId: 'rec3', type: 'mcq-multi', numberToSelect: 2,
          question: 'Why did Priya and Ben choose London transport history? (Choose TWO)',
          options: [
            'Their tutor recommended it',
            'Lots of source material is available',
            "It's the easiest topic to summarise",
            'It connects to everyday life in London',
            'It relates to their music interests',
          ],
          correctAnswer: ['B', 'D'] },
        { id: 's3q2', recordingId: 'rec3', type: 'mcq-multi', numberToSelect: 2,
          question: 'What difficulties have they encountered? (Choose TWO)',
          options: [
            'Finding time to meet',
            'Too much source material to filter through',
            'Disagreements about their main argument',
            'Lack of interest from other students',
            'Difficulty accessing the archives',
          ],
          correctAnswer: ['A', 'B'] },

        { id: 's3q3', recordingId: 'rec3', type: 'mcq-single', question: 'Why did they NOT choose music history?',
          options: ['It was too popular a topic', 'Neither of them has a musical background', 'Sources were hard to find'], correctAnswer: 'B' },
        { id: 's3q4', recordingId: 'rec3', type: 'mcq-single', question: 'What is the main argument of their project?',
          options: [
            "The London Underground shaped the city's social geography",
            'The London Transport Museum should be expanded',
            "Double-decker buses defined London's identity",
          ], correctAnswer: 'A' },
        { id: 's3q5', recordingId: 'rec3', type: 'mcq-single', question: 'How have they divided the workload?',
          options: ['By type of transport', 'By historical era', 'By research method'], correctAnswer: 'B' },
        { id: 's3q6', recordingId: 'rec3', type: 'mcq-single', question: 'What format will their final project take?',
          options: ['A written essay', 'An oral presentation', 'A video'], correctAnswer: 'C' },
        { id: 's3q7', recordingId: 'rec3', type: 'mcq-single', question: 'Who is their intended audience?',
          options: ['Members of the public', 'Other Level 1 and Level 2 students', 'Academic historians'], correctAnswer: 'B' },
        { id: 's3q8', recordingId: 'rec3', type: 'mcq-single', question: 'What did Priya specifically ask the tutor for?',
          options: ['Help with research sources', 'Extra time for filming', 'Feedback on the structure'], correctAnswer: 'C' },

        // ── SECTION 4 · Lecture notes (Q11-20 form-fill) ─────────────────────
        { id: 's4q1',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'era',                     correctAnswer: 'Victorian',   maxWords: 1 },
        { id: 's4q2',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'fifth Victorian shop',   correctAnswer: 'chemist',     maxWords: 1 },
        { id: 's4q3',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'store type post-WWII',   correctAnswer: 'chain',       maxWords: 1 },
        { id: 's4q4',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'out-of-town decade',     correctAnswer: '1980s',       maxWords: 1 },
        { id: 's4q5',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'online retail %',        correctAnswer: '30',          maxWords: 1 },
        { id: 's4q6',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'third worst-hit sector', correctAnswer: 'clothing',    maxWords: 1 },
        { id: 's4q7',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'Covid footfall drop',    correctAnswer: 'three',       maxWords: 1 },
        { id: 's4q8',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'main shift',             correctAnswer: 'hospitality', maxWords: 1 },
        { id: 's4q9',  recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'community hub area',     correctAnswer: 'co-working',  maxWords: 1 },
        { id: 's4q10', recordingId: 'rec4', type: 'notes-bullet-fill', question: '', formContextId: 'highstreets-notes', label: 'High Street scheme',     correctAnswer: 'Fund',        maxWords: 1 }
      ],
      durationMinutes: 30
    },
    writing: {
      id: 'mock-1-writing',
      taskNumber: 2,
      prompt: 'Does social media negatively impact wellbeing?',
      promptDescription: 'Social media platforms enable users to share and interact with communities, people, businesses, and more online. Discuss the different ways that social media can affect people\'s well-being.',
      instructions: 'Give reasons for your answer and include relevant examples from your knowledge or experience.',
      minWords: 250,
      durationMinutes: 40
    }
  },
  { id: 'mock-2', number: 2, title: 'Mock Test 2', status: 'locked', reading: null, listening: null, writing: null },
  { id: 'mock-3', number: 3, title: 'Mock Test 3', status: 'locked', reading: null, listening: null, writing: null },
  { id: 'mock-4', number: 4, title: 'Mock Test 4', status: 'locked', reading: null, listening: null, writing: null },
  { id: 'mock-5', number: 5, title: 'Mock Test 5', status: 'locked', reading: null, listening: null, writing: null }
]

export const DUMMY_MOCK_ATTEMPTS: MockSectionAttempt[] = []
