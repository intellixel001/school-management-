'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { useKioskSession } from '../../../../_components/KioskSessionProvider'
import { getStudentMockAttempts } from '@/lib/services'
import type { MockSectionAttempt } from '@/types/platform'
import { Spinner } from '@/components/ui'

export default function MockSubmittedPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useKioskSession()
  const [attempt, setAttempt] = useState<MockSectionAttempt | null>(null)
  const [loading, setLoading] = useState(true)

  const skill = params.skill as string

  useEffect(() => {
    if (!session) { router.replace('/kiosk'); return }
    let cancelled = false
    getStudentMockAttempts(session.studentId).then(all => {
      if (cancelled) return
      const a = all.find(x => x.mockExamId === params.mockId && x.skill === skill)
      setAttempt(a || null)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [session, params, skill, router])

  if (loading) {
    return <div className="flex items-center justify-center w-full h-full bg-[#FAFAFA]"><Spinner size="lg" /></div>
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center bg-[#FAFAFA]">
        <p className="font-body">Submission not found.</p>
        <button onClick={() => router.push('/kiosk/mock')} className="underline">Back to mock list</button>
      </div>
    )
  }

  const isReviewed = attempt.status === 'reviewed'

  return isReviewed ? <RevealedScoreView attempt={attempt} skill={skill} router={router} /> : <AwaitingReviewView attempt={attempt} skill={skill} router={router} />
}

function AwaitingReviewView({ attempt, skill, router }: { attempt: MockSectionAttempt, skill: string, router: any }) {
  const m = Math.floor(attempt.durationSeconds / 60)
  const s = attempt.durationSeconds % 60
  const timeTakenStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

  const answeredCount = Object.keys(attempt.answers || {}).length

  return (
    <div className="flex flex-col items-center justify-center w-full h-[100dvh] bg-[#FAFAFA] px-6 text-center">
      <div className="mb-8 p-4 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
        <CheckCircle size={64} style={{ color: '#F59E0B' }} strokeWidth={1.5} />
      </div>
      
      <h1 className="font-display font-bold mb-4" style={{ fontSize: 32, color: 'var(--text-primary)' }}>
        {skill.charAt(0).toUpperCase() + skill.slice(1)} submitted.
      </h1>
      
      <p className="font-body text-gray-600 mb-12 max-w-md" style={{ fontSize: 18, lineHeight: 1.6 }}>
        Your answers have been recorded. Your teacher will review and publish your score soon.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 w-full max-w-sm mb-12 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="font-body text-gray-500">Time taken</span>
          <span className="font-mono font-medium">{timeTakenStr}</span>
        </div>
        {skill === 'writing' ? (
          <div className="flex justify-between items-center">
            <span className="font-body text-gray-500">Words written</span>
            <span className="font-mono font-medium">{attempt.writingAiScore?.wordCount || 0}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="font-body text-gray-500">Questions answered</span>
            <span className="font-mono font-medium">{answeredCount} of {attempt.totalQuestions}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={() => router.push('/kiosk/mock')}
          className="w-full py-4 rounded-xl font-body font-semibold text-white transition-transform active:scale-95"
          style={{ background: 'var(--accent-primary)', fontSize: 16 }}
        >
          Back to mock list
        </button>
        <button 
          onClick={() => router.push('/kiosk/menu')}
          className="w-full py-4 rounded-xl font-body font-medium transition-transform active:scale-95"
          style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: 16 }}
        >
          Back to menu
        </button>
      </div>
    </div>
  )
}

function RevealedScoreView({ attempt, skill, router }: { attempt: MockSectionAttempt, skill: string, router: any }) {
  const finalBand = attempt.teacherFinalBand ?? attempt.teacherFinalWritingScore?.bands.overallBand ?? attempt.ieltsBand

  return (
    <div className="flex flex-col items-center justify-center w-full h-[100dvh] bg-[#F0FDF4] px-6 text-center overflow-y-auto py-12">
      <div className="mb-8 p-4 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
        <CheckCircle size={64} style={{ color: '#10B981' }} strokeWidth={1.5} />
      </div>
      
      <h1 className="font-display font-bold mb-4" style={{ fontSize: 32, color: '#065F46' }}>
        {skill.charAt(0).toUpperCase() + skill.slice(1)} reviewed ✓
      </h1>
      
      <div className="bg-white border border-[#10B981] rounded-2xl p-8 w-full max-w-md mb-8 shadow-sm flex flex-col gap-6 text-left">
        <div className="text-center">
          <div className="text-gray-500 font-medium mb-2">Final Score</div>
          <div className="text-5xl font-bold text-[#10B981]">Band {finalBand}</div>
        </div>
        
        {skill !== 'writing' && attempt.teacherFinalRawScore != null && (
          <div className="text-center text-gray-500 font-medium">
            Raw score: {attempt.teacherFinalRawScore} / {attempt.totalQuestions}
          </div>
        )}

        {skill === 'writing' && attempt.teacherFinalWritingScore && (
          <div className="border-t border-gray-100 pt-6 mt-2 grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Task Response</span>
              <span className="text-lg font-semibold text-gray-800">{attempt.teacherFinalWritingScore.bands.taskResponse.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Coherence</span>
              <span className="text-lg font-semibold text-gray-800">{attempt.teacherFinalWritingScore.bands.coherenceCohesion.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Lexical</span>
              <span className="text-lg font-semibold text-gray-800">{attempt.teacherFinalWritingScore.bands.lexicalResource.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Grammar</span>
              <span className="text-lg font-semibold text-gray-800">{attempt.teacherFinalWritingScore.bands.grammaticalRange.toFixed(1)}</span>
            </div>
          </div>
        )}

        {attempt.teacherFeedback && (
          <div className="border-t border-[#10B981]/20 pt-6 mt-2">
            <h4 className="text-sm font-bold text-[#065F46] uppercase tracking-wider mb-3">Teacher's Note</h4>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed italic">{attempt.teacherFeedback}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={() => router.push('/kiosk/mock')}
          className="w-full py-4 rounded-xl font-body font-semibold text-white transition-transform active:scale-95 shadow-sm"
          style={{ background: '#10B981', fontSize: 16 }}
        >
          View results
        </button>
      </div>
    </div>
  )
}
