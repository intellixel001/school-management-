// ── Practice Pool Service ──────────────────────────────────────────────────────
// Every accessor validates content and falls back to a complete local exercise,
// so a malformed API response or dummy record cannot render blank questions.

import { PRACTICE_POOLS } from '@/lib/dummy/pools'
import { USE_REAL_API } from '@/lib/api/env'
import { apiFetch } from '@/lib/api/client'
import { normalizePassageQuestions } from '@/lib/api/adapters'
import type {
  SkillLevel, ReadingPassage, ReadingQuestion, WritingPrompt, WritingTask,
  SpeakingTopic, SpeakingTask, ListeningPassage, ListeningQuestion,
} from '@/types/platform'

const ITEMS_PER_SESSION = 5
const lastSelection = new Map<string, string>()

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function pickRandomWithoutImmediateRepeat<T extends { id: string }>(items: readonly T[], key: string): T {
  const previousId = lastSelection.get(key)
  const candidates = items.length > 1 ? items.filter(item => item.id !== previousId) : [...items]
  const selected = candidates[Math.floor(Math.random() * candidates.length)] ?? items[0]
  lastSelection.set(key, selected.id)
  return selected
}

function isValidQuestion(question: ReadingQuestion | ListeningQuestion): boolean {
  if (!hasText(question.id) || !hasText(question.question) || !hasText(question.correctAnswer)) return false
  if (question.type === 'mcq') {
    return Array.isArray(question.options) && question.options.length >= 2 && question.options.every(hasText)
  }
  return question.type === 'open'
}

function isValidWritingTask(task: WritingTask): boolean {
  return hasText(task.id) && hasText(task.instruction)
}

function isValidSpeakingTask(task: SpeakingTask): boolean {
  return hasText(task.id) && hasText(task.instruction)
}

function isValidReading(item: ReadingPassage): boolean {
  return hasText(item.id) && hasText(item.title) && hasText(item.text)
    && Array.isArray(item.questions) && item.questions.length === ITEMS_PER_SESSION
    && item.questions.every(isValidQuestion)
}

function isValidListening(item: ListeningPassage): boolean {
  return hasText(item.id) && hasText(item.title) && hasText(item.passage)
    && Array.isArray(item.questions) && item.questions.length === ITEMS_PER_SESSION
    && item.questions.every(isValidQuestion)
}

function isValidWriting(item: WritingPrompt): boolean {
  return hasText(item.id) && hasText(item.title) && hasText(item.prompt)
    && Array.isArray(item.tasks) && item.tasks.length === ITEMS_PER_SESSION
    && item.tasks.every(isValidWritingTask)
}

function isValidSpeaking(item: SpeakingTopic): boolean {
  return hasText(item.id) && hasText(item.title) && hasText(item.scenario) && hasText(item.openingPrompt)
    && Array.isArray(item.tasks) && item.tasks.length === ITEMS_PER_SESSION
    && item.tasks.every(isValidSpeakingTask)
}

function fallbackReading(level: SkillLevel): ReadingPassage {
  return {
    id: `r-${level}-fallback`, title: 'A Visit to the Library', level, type: 'article',
    text: 'Sam visits the library on Tuesday at ten o’clock. He returns one book, borrows a story book, and studies at a table near the window. The library closes at five o’clock.',
    questions: [
      { id: `r-${level}-fallback-q1`, type: 'mcq', question: 'Where does Sam go?', options: ['The library', 'The bank', 'The station', 'The hospital'], correctAnswer: 'The library' },
      { id: `r-${level}-fallback-q2`, type: 'open', question: 'Which day does Sam visit?', correctAnswer: 'Tuesday' },
      { id: `r-${level}-fallback-q3`, type: 'mcq', question: 'What does Sam return?', options: ['A book', 'A key', 'A bag', 'A ticket'], correctAnswer: 'A book' },
      { id: `r-${level}-fallback-q4`, type: 'open', question: 'Where does Sam study?', correctAnswer: 'At a table near the window' },
      { id: `r-${level}-fallback-q5`, type: 'mcq', question: 'When does the library close?', options: ['Three o’clock', 'Four o’clock', 'Five o’clock', 'Six o’clock'], correctAnswer: 'Five o’clock' },
    ],
  }
}

function fallbackListening(level: SkillLevel): ListeningPassage {
  return {
    id: `l-${level}-fallback`, title: 'Classroom Announcement', level, type: 'announcement',
    passage: 'The English class starts at nine o’clock in Room 4. Please bring a notebook and a pen. After class, students can meet the teacher in the library.',
    questions: [
      { id: `l-${level}-fallback-q1`, type: 'mcq', question: 'What time does the class start?', options: ['Eight o’clock', 'Nine o’clock', 'Ten o’clock', 'Eleven o’clock'], correctAnswer: 'Nine o’clock', marks: 1, criterion: 'Identify and retrieve information' },
      { id: `l-${level}-fallback-q2`, type: 'open', question: 'Which room is the class in?', correctAnswer: 'Room 4', marks: 1, criterion: 'Identify and retrieve information' },
      { id: `l-${level}-fallback-q3`, type: 'mcq', question: 'What should students bring?', options: ['A notebook and a pen', 'A laptop and headphones', 'Food and water', 'A coat and umbrella'], correctAnswer: 'A notebook and a pen', marks: 1, criterion: 'Identify and retrieve information' },
      { id: `l-${level}-fallback-q4`, type: 'open', question: 'Who can students meet after class?', correctAnswer: 'The teacher', marks: 1, criterion: 'Identify and retrieve information' },
      { id: `l-${level}-fallback-q5`, type: 'mcq', question: 'Where can students meet the teacher?', options: ['In the café', 'In the office', 'In the library', 'At the station'], correctAnswer: 'In the library', marks: 1, criterion: 'Identify and retrieve information' },
    ],
  }
}

function fallbackWriting(level: SkillLevel): WritingPrompt {
  const instructions = [
    'Write two sentences about your morning routine.',
    'Write two sentences about a place you like to visit.',
    'Write a short message inviting a friend to meet you.',
    'Write two sentences about your favourite meal.',
    'Write two sentences about something you want to learn.',
  ]
  return {
    id: `w-${level}-fallback`, title: 'Everyday Writing', level, type: 'article',
    prompt: 'Write short, clear sentences about familiar topics.', audience: 'Your teacher',
    purpose: 'To practise clear everyday writing', wordCountGuidance: 'Write at least two sentences for each task',
    criteria: ['Answer the task clearly', 'Use complete sentences', 'Check spelling and punctuation'],
    tasks: instructions.map((instruction, index) => ({
      id: `wt-${level}-fallback-${index + 1}`, instruction, minWords: 8,
      hint: 'Start with the main idea, then add one useful detail.',
    })),
  }
}

function fallbackSpeaking(level: SkillLevel): SpeakingTopic {
  const instructions = [
    'Introduce yourself and say where you are from.',
    'Describe one thing you do every morning.',
    'Talk about a food you enjoy and explain why.',
    'Describe a place you like to visit.',
    'Say one thing you want to learn in the future.',
  ]
  return {
    id: `s-${level}-fallback`, title: 'Everyday Conversation', level, format: 'discussion',
    scenario: 'Your teacher asks you to talk about familiar everyday topics.',
    openingPrompt: 'Tell me a little about yourself.',
    followUpPrompts: ['Can you add one more detail?', 'Why is that important to you?'],
    assessmentFocus: ['Clear speech', 'Relevant answers', 'Complete sentences'],
    tasks: instructions.map((instruction, index) => ({
      id: `st-${level}-fallback-${index + 1}`, instruction, expectedDurationSec: 20,
      hint: 'Speak in one or two complete sentences.',
    })),
  }
}

function localReading(level: SkillLevel): ReadingPassage[] {
  const valid = (PRACTICE_POOLS[level]?.reading ?? []).filter(isValidReading)
  return valid.length > 0 ? valid : [fallbackReading(level)]
}

function localListening(level: SkillLevel): ListeningPassage[] {
  const valid = (PRACTICE_POOLS[level]?.listening ?? []).filter(isValidListening)
  return valid.length > 0 ? valid : [fallbackListening(level)]
}

function localWriting(level: SkillLevel): WritingPrompt[] {
  const valid = (PRACTICE_POOLS[level]?.writing ?? []).filter(isValidWriting)
  return valid.length > 0 ? valid : [fallbackWriting(level)]
}

function localSpeaking(level: SkillLevel): SpeakingTopic[] {
  const valid = (PRACTICE_POOLS[level]?.speaking ?? []).filter(isValidSpeaking)
  return valid.length > 0 ? valid : [fallbackSpeaking(level)]
}

function randomizeReading(item: ReadingPassage): ReadingPassage {
  return { ...item, questions: shuffle(item.questions).map(question => ({
    ...question, options: question.options ? [...question.options] : undefined,
  })) }
}

function randomizeListening(item: ListeningPassage): ListeningPassage {
  return { ...item, questions: shuffle(item.questions).map(question => ({
    ...question, options: question.options ? [...question.options] : undefined,
  })) }
}

function randomizeWriting(item: WritingPrompt): WritingPrompt {
  return { ...item, criteria: [...item.criteria], tasks: shuffle(item.tasks ?? []) }
}

function randomizeSpeaking(item: SpeakingTopic): SpeakingTopic {
  return {
    ...item, followUpPrompts: [...item.followUpPrompts], assessmentFocus: [...item.assessmentFocus],
    tasks: shuffle(item.tasks ?? []),
  }
}

export async function getPracticeReadingForLevel(level: SkillLevel): Promise<ReadingPassage[]> {
  if (USE_REAL_API) {
    try {
      const raw = await apiFetch<ReadingPassage[]>(`/api/practice-pool?level=${encodeURIComponent(level)}&skill=reading`)
      const valid = raw.map(normalizePassageQuestions).filter(isValidReading)
      if (valid.length > 0) return shuffle(valid).map(randomizeReading)
    } catch { /* use local pool */ }
  }
  return shuffle(localReading(level)).map(randomizeReading)
}

export async function getPracticeWritingForLevel(level: SkillLevel): Promise<WritingPrompt[]> {
  if (USE_REAL_API) {
    try {
      const raw = await apiFetch<WritingPrompt[]>(`/api/practice-pool?level=${encodeURIComponent(level)}&skill=writing`)
      const valid = raw.filter(isValidWriting)
      if (valid.length > 0) return shuffle(valid).map(randomizeWriting)
    } catch { /* use local pool */ }
  }
  return shuffle(localWriting(level)).map(randomizeWriting)
}

export async function getPracticeSpeakingForLevel(level: SkillLevel): Promise<SpeakingTopic[]> {
  if (USE_REAL_API) {
    try {
      const raw = await apiFetch<SpeakingTopic[]>(`/api/practice-pool?level=${encodeURIComponent(level)}&skill=speaking`)
      const valid = raw.filter(isValidSpeaking)
      if (valid.length > 0) return shuffle(valid).map(randomizeSpeaking)
    } catch { /* use local pool */ }
  }
  return shuffle(localSpeaking(level)).map(randomizeSpeaking)
}

export async function getPracticeListeningForLevel(level: SkillLevel): Promise<ListeningPassage[]> {
  if (USE_REAL_API) {
    try {
      const raw = await apiFetch<ListeningPassage[]>(`/api/practice-pool?level=${encodeURIComponent(level)}&skill=listening`)
      const valid = raw.map(normalizePassageQuestions).filter(isValidListening)
      if (valid.length > 0) return shuffle(valid).map(randomizeListening)
    } catch { /* use local pool */ }
  }
  return shuffle(localListening(level)).map(randomizeListening)
}

export async function getRandomPracticePassage(level: SkillLevel, skill: 'reading'): Promise<ReadingPassage>
export async function getRandomPracticePassage(level: SkillLevel, skill: 'listening'): Promise<ListeningPassage>
export async function getRandomPracticePassage(
  level: SkillLevel, skill: 'reading' | 'listening',
): Promise<ReadingPassage | ListeningPassage> {
  if (USE_REAL_API) {
    try {
      const raw = await apiFetch<ReadingPassage | ListeningPassage>(
        `/api/practice-pool/random?level=${encodeURIComponent(level)}&skill=${skill}`,
      )
      const normalized = normalizePassageQuestions(raw)
      if (skill === 'reading' && isValidReading(normalized as ReadingPassage)) return randomizeReading(normalized as ReadingPassage)
      if (skill === 'listening' && isValidListening(normalized as ListeningPassage)) return randomizeListening(normalized as ListeningPassage)
    } catch { /* use local pool */ }
  }
  if (skill === 'reading') {
    return randomizeReading(pickRandomWithoutImmediateRepeat(localReading(level), `${level}:reading`))
  }
  return randomizeListening(pickRandomWithoutImmediateRepeat(localListening(level), `${level}:listening`))
}

export async function getRandomPracticePrompt(level: SkillLevel, skill: 'writing'): Promise<WritingPrompt>
export async function getRandomPracticePrompt(level: SkillLevel, skill: 'speaking'): Promise<SpeakingTopic>
export async function getRandomPracticePrompt(
  level: SkillLevel, skill: 'writing' | 'speaking',
): Promise<WritingPrompt | SpeakingTopic> {
  if (USE_REAL_API) {
    try {
      const raw = await apiFetch<WritingPrompt | SpeakingTopic>(
        `/api/practice-pool/random?level=${encodeURIComponent(level)}&skill=${skill}`,
      )
      if (skill === 'writing' && isValidWriting(raw as WritingPrompt)) return randomizeWriting(raw as WritingPrompt)
      if (skill === 'speaking' && isValidSpeaking(raw as SpeakingTopic)) return randomizeSpeaking(raw as SpeakingTopic)
    } catch { /* use local pool */ }
  }
  if (skill === 'writing') {
    return randomizeWriting(pickRandomWithoutImmediateRepeat(localWriting(level), `${level}:writing`))
  }
  return randomizeSpeaking(pickRandomWithoutImmediateRepeat(localSpeaking(level), `${level}:speaking`))
}

export async function getRandomWritingPrompt(level: SkillLevel): Promise<WritingPrompt | null> {
  return getRandomPracticePrompt(level, 'writing')
}

export async function getRandomSpeakingTopic(level: SkillLevel): Promise<SpeakingTopic | null> {
  return getRandomPracticePrompt(level, 'speaking')
}
