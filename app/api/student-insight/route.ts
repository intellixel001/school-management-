import { NextRequest, NextResponse } from 'next/server'
import { groqChat } from '@/lib/ai/groqChat'
import { getStudentById, getSessionsByStudentId, getStudentStats } from '@/lib/services'
import { buildStudentInsightPrompt } from '@/lib/prompts/studentInsight'
import type { Student, Session } from '@/types/platform'
import type { StudentStats } from '@/lib/services'

// In-memory cache — 6h TTL per student. Replace with Redis when backend lands.
const cache = new Map<string, { value: any; expiresAt: number }>()
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

const VALID_SKILLS = new Set(['reading', 'writing', 'listening', 'speaking'])

function computeWeeklyFacts(student: Student, sessions: Session[], stats: StudentStats) {
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000
  const twoWeeksStart = Date.now() - 14 * 24 * 60 * 60 * 1000

  const thisWeek = sessions.filter(s => s.status === 'completed' && new Date(s.date).getTime() >= weekStart)
  const lastWeek = sessions.filter(s => {
    const t = new Date(s.date).getTime()
    return s.status === 'completed' && t >= twoWeeksStart && t < weekStart
  })

  const skillEntries = Object.entries(student.skills) as [string, number][]
  const validSkills = skillEntries.filter(([_, v]) => v > 0)
  const strongest = validSkills.length ? validSkills.reduce((a, b) => b[1] > a[1] ? b : a) : null
  const weakest   = validSkills.length ? validSkills.reduce((a, b) => b[1] < a[1] ? b : a) : null

  return {
    sessionsThisWeek: thisWeek.length,
    sessionsLastWeek: lastWeek.length,
    streak: student.streak,
    strongestSkill: strongest?.[0] ?? null,
    strongestScore: strongest?.[1] ?? null,
    weakestSkill: weakest?.[0] ?? null,
    weakestScore: weakest?.[1] ?? null,
    totalPoints: student.totalPoints,
  }
}

function buildTemplatedFallback(f: any, firstName: string) {
  if (f.sessionsThisWeek === 0) {
    return `Welcome back, ${firstName}. Ready to start a session?`
  }
  return `You've completed ${f.sessionsThisWeek} session${f.sessionsThisWeek === 1 ? '' : 's'} this week. Keep going.`
}

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  // Cache hit
  const cached = cache.get(studentId)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value)
  }

  // Gather facts
  const student = await getStudentById(studentId)
  if (!student) return NextResponse.json({ error: 'student not found' }, { status: 404 })

  const stats = await getStudentStats(studentId)
  const sessions = await getSessionsByStudentId(studentId)

  // Compute facts to feed Groq — ONLY these, nothing more
  const facts = computeWeeklyFacts(student, sessions, stats)

  // Build fallback FIRST so we always have something
  const fallback = buildTemplatedFallback(facts, student.name.split(' ')[0])

  let result: { insight: string; suggestedSkill: string | null; source: 'ai' | 'fallback' } = {
    insight: fallback,
    suggestedSkill: facts.weakestSkill,
    source: 'fallback',
  }

  try {
    const { content: raw } = await groqChat({
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 120,
      messages: [
        { role: 'system', content: buildStudentInsightPrompt() },
        { role: 'user', content: JSON.stringify(facts) },
      ],
    })
    if (raw) {
      const parsed = JSON.parse(raw)
      // Validate hard
      if (
        typeof parsed.insight === 'string' &&
        parsed.insight.length > 0 &&
        parsed.insight.length <= 200 &&
        (parsed.suggestedSkill === null || VALID_SKILLS.has(parsed.suggestedSkill))
      ) {
        result = {
          insight: parsed.insight,
          suggestedSkill: parsed.suggestedSkill,
          source: 'ai',
        }
      }
    }
  } catch {
    // Swallow — fallback already set
  }

  // Cache result (even fallback — prevents Groq hammering on errors)
  cache.set(studentId, { value: result, expiresAt: Date.now() + CACHE_TTL_MS })

  return NextResponse.json(result)
}
