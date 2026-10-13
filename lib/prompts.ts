import type { SkillArea, SkillLevel } from '@/types/platform'
import type { EvaluationQuestion } from '@/app/api/evaluate-session/route'

// ═══════════════════════════════════════════════════════════════════════════════
// ContentContext — still used by /api/chat for the voice tutor feature
// ═══════════════════════════════════════════════════════════════════════════════

import type { ReadingPassage, WritingPrompt, SpeakingTopic, ListeningPassage } from '@/types'

export type ContentContext =
  | { skillArea: 'reading'; content: ReadingPassage }
  | { skillArea: 'writing'; content: WritingPrompt }
  | { skillArea: 'speaking'; content: SpeakingTopic }
  | { skillArea: 'listening'; content: ListeningPassage }

/**
 * @deprecated The per-skill conversational prompt builders (buildReadingPrompt etc.) have been
 * removed in Arch-Phase-2-rebuild. The voice tutor (/api/chat) now uses a generic fallback.
 * Practice sessions use buildEvaluationPrompt + /api/evaluate-session exclusively.
 */
export function buildSystemPrompt(_ctx: ContentContext): string {
  return `You are an expert English tutor at Nelson College London. Help the learner improve their English.
Always return a single valid JSON object: { "reply": string, "vocab": string[] }
Stay on topic. Be warm and encouraging.`
}

// ═══════════════════════════════════════════════════════════════════════════════
// Batch Evaluation Prompt — used ONCE per session by /api/evaluate-session
// ═══════════════════════════════════════════════════════════════════════════════

const LEVEL_CALIBRATION: Record<SkillLevel, string> = {
  'entry-1': 'This student is a beginner (Entry Level 1). Be very generous — award isCorrect: true for any answer that addresses the question\'s intent and is roughly accurate. Minor grammar, spelling, and phrasing errors are completely fine.',
  'entry-2': 'This student is elementary (Entry Level 2). Be reasonably generous. The answer should address the question accurately, though minor errors in grammar or phrasing are acceptable.',
  'entry-3': 'This student is pre-intermediate (Entry Level 3). Apply moderate strictness. The answer should be substantively correct and reasonably well-formed. Minor errors are OK but the core content must be right.',
  'level-1': 'This student is preparing for IELTS (Level 1). Be strict but fair. The answer should demonstrate clear comprehension and coherent reasoning. Vague or partially-addressed answers should be marked incorrect.',
}

const SKILL_GUIDANCE: Record<SkillArea, string> = {
  reading: 'The student read the passage above before answering. Their answers should reflect understanding of the passage\'s content. For MCQ, check exact match (case-insensitive). For open questions, semantic match to the passage.',
  listening: 'The student heard the passage (you see the transcript above). Allow for minor mishearings in their answers; focus on whether they captured the core meaning. Do NOT penalize paraphrasing.',
  writing: 'The student wrote their own response to each task. Evaluate whether they addressed the task instruction, stayed on-topic, and met any length expectation. Do NOT penalize minor grammar errors — encourage practice.',
  speaking: 'The student spoke their answer and you see the transcription. The transcript may contain ASR (speech recognizer) errors — the student may have said something slightly different. Focus on intent and content over exact wording.',
}

export function buildEvaluationPrompt(
  skillArea: SkillArea,
  level: SkillLevel,
  contentText: string | undefined,
  questions: EvaluationQuestion[]
): string {
  const questionsFormatted = questions.map((q, i) => {
    const lines = [
      `Q${i + 1}. [${q.type.toUpperCase()}] ${q.question}`,
    ]
    if (q.options && q.options.length > 0) {
      lines.push(`   Options: ${q.options.join(' | ')}`)
    }
    if (q.correctAnswer) {
      lines.push(`   Expected answer: ${q.correctAnswer}`)
    } else {
      lines.push(`   Expected answer: (open — evaluate against the task instruction and context)`)
    }
    lines.push(`   Student's answer: ${q.studentAnswer || '(no answer given)'}`)
    return lines.join('\n')
  }).join('\n\n')

  return `You are evaluating a student's ${skillArea} practice session at ${level} level.

You are NOT a tutor. You are NOT having a conversation. Your ONLY job is to read the 5 (question, expected answer, student answer) tuples below and return a single JSON evaluation object.

LEVEL CALIBRATION:
${LEVEL_CALIBRATION[level]}

SKILL CONTEXT:
${SKILL_GUIDANCE[skillArea]}

${contentText ? `CONTENT (passage/topic the student worked with):
---
${contentText}
---

` : ''}QUESTIONS AND STUDENT ANSWERS:
${questionsFormatted}

EVALUATION RULES:
- MCQ questions: isCorrect = true if the student's answer matches the expected answer (case-insensitive, trimmed). No partial credit.
- Open questions: isCorrect = true if the student's answer semantically addresses the question and is substantively correct given the context. Apply the level calibration above.
- If a student left an answer blank or wrote only whitespace: isCorrect = false.
- overallScore = (number of correct answers / 5) × 100, as an integer.
- correctCount = exact count of questions where isCorrect is true (0–5).
- overallFeedback: 2–3 sentences, and MATCH THE TONE TO THE OUTCOME:
    * If correctCount = 5 (all correct): purely celebrate. Do NOT invent an "area to improve" — none is needed. Encourage them to keep this level up or try harder material.
    * If correctCount = 0: be kind but honest. Focus on one specific area to work on next. Do NOT fabricate praise.
    * Otherwise (1-4 correct): acknowledge one specific thing they did well AND name one specific area to improve. Reference actual question content — no generic advice.
  Never give feedback that contradicts the score. Never manufacture praise or criticism.
- vocabSuggestions: up to 5 useful vocabulary words from the content that are relevant to the student's gaps. Omit if not applicable.

Return ONLY the JSON object below. No markdown. No code fences. No preamble. No explanation. ONLY the JSON.

{
  "overallScore": <integer 0-100>,
  "correctCount": <integer 0-5>,
  "perQuestion": [
    {"questionId": "${questions[0]?.id}", "isCorrect": <true|false>, "feedback": "<1 sentence>"},
    {"questionId": "${questions[1]?.id}", "isCorrect": <true|false>, "feedback": "<1 sentence>"},
    {"questionId": "${questions[2]?.id}", "isCorrect": <true|false>, "feedback": "<1 sentence>"},
    {"questionId": "${questions[3]?.id}", "isCorrect": <true|false>, "feedback": "<1 sentence>"},
    {"questionId": "${questions[4]?.id}", "isCorrect": <true|false>, "feedback": "<1 sentence>"}
  ],
  "overallFeedback": "<2-3 sentences>",
  "vocabSuggestions": ["<word>", "<word>"]
}`
}

/**
 * Builds the system prompt for evaluating a student's mock writing essay.
 * Uses Karani's IELTS 4-band rubric: TR, CC, LR, GRA.
 *
 * The AI returns:
 * - Four band scores (0-9 each, 0.5 increments)
 * - Two boolean flags: offTopic, memorised
 * - Qualitative feedback (2-4 sentences)
 * - Per-band reasoning (one sentence each)
 *
 * UNDERLENGTH is auto-computed server-side from word count, NOT asked of the AI.
 */
export function buildMockWritingPrompt(
  level: SkillLevel,
  promptText: string,
  promptDescription: string,
  studentEssay: string,
  minWords: number,
): string {
  const levelGuidance: Record<SkillLevel, string> = {
    'entry-1': 'This student is a beginner. Be lenient. Reward clear effort and basic task engagement. Bands typically 3-5.',
    'entry-2': 'Slightly stricter than Entry 1. Reward clarity + basic structure. Bands typically 4-6.',
    'entry-3': 'Moderate strictness. Reward developed paragraphs + accurate use of common vocabulary/grammar. Bands typically 5-7.',
    'level-1': 'IELTS-prep level — apply the standard IELTS Writing rubric strictly. Bands typically 5-8.',
  }

  return `You are an IELTS examiner scoring a Writing Task 2 essay.

LEVEL CALIBRATION: ${level} — ${levelGuidance[level]}

═══ THE WRITING TASK ═══
Prompt: ${promptText}

Context: ${promptDescription}

Minimum word count: ${minWords}

═══ THE STUDENT'S ESSAY ═══
${studentEssay}

═══ EVALUATION RUBRIC ═══
Score the essay on Karani's IELTS 4-band rubric. Each band is 0-9 in 0.5 increments.

1. **Task Response (TR)** — How fully did they address the prompt?
   Consider: argument clarity, position, supporting examples, response to all parts of the task.

2. **Coherence & Cohesion (CC)** — Is the essay logically organized?
   Consider: paragraph structure, logical flow between ideas, linking words/phrases, progression.

3. **Lexical Resource (LR)** — Vocabulary quality.
   Consider: range, accuracy, appropriacy, collocations, less common items used naturally.

4. **Grammatical Range & Accuracy (GRA)** — Grammar quality.
   Consider: sentence variety, structures attempted, correctness, error frequency/impact.

═══ FLAGS TO DETECT ═══
- offTopic: TRUE if the essay does not actually address the prompt (e.g., wrote about unrelated subject).
- memorised: TRUE if the essay reads as a memorised/templated response with vague generic phrases (e.g., "In this modern era of globalization..." filler with no specific engagement).

Do NOT flag underlength — that's computed separately from word count.

═══ OUTPUT FORMAT ═══
Return ONLY a JSON object matching EXACTLY this shape. No prose preamble, no markdown fences, just the JSON:

{
  "bands": {
    "taskResponse": <number 0-9, 0.5 increments>,
    "coherenceCohesion": <number>,
    "lexicalResource": <number>,
    "grammaticalRange": <number>
  },
  "flags": {
    "offTopic": <true|false>,
    "memorised": <true|false>
  },
  "feedback": "<2-4 sentences of constructive feedback — what they did well + one or two clear suggestions for improvement>",
  "bandReasoning": {
    "taskResponse": "<one short sentence explaining the TR band>",
    "coherenceCohesion": "<one short sentence explaining the CC band>",
    "lexicalResource": "<one short sentence explaining the LR band>",
    "grammaticalRange": "<one short sentence explaining the GRA band>"
  }
}

Be honest but constructive. Give the same band you would for IELTS — no inflation, no pity-grading.`
}
