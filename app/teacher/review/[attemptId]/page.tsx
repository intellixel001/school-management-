'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMockReviewDetail, publishMockSectionAttempt, type MockReviewDetail } from '@/lib/services'
import { Spinner } from '@/components/ui'
import { ReadingReviewDetail } from '../_components/ReadingReviewDetail'
import { ListeningReviewDetail } from '../_components/ListeningReviewDetail'
import { WritingReviewDetail } from '../_components/WritingReviewDetail'
import Link from 'next/link'
import { PublishConfirmDialog } from '../_components/PublishConfirmDialog'
import { TeacherPageHero } from '../../_components/TeacherPageHero'
import type { MockWritingScore } from '@/types/platform'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m}m`
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}



export default function MockReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [detail, setDetail] = useState<MockReviewDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [teacherFeedback, setTeacherFeedback] = useState('')
  const [teacherFinalRawScore, setTeacherFinalRawScore] = useState<number | undefined>(undefined)
  const [teacherFinalBand, setTeacherFinalBand] = useState<number | undefined>(undefined)
  const [teacherFinalWritingScore, setTeacherFinalWritingScore] = useState<MockWritingScore | undefined>(undefined)

  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const MOCK_SECTION_POINTS = 25

  useEffect(() => {
    let cancelled = false
    getMockReviewDetail(attemptId).then(d => {
      if (cancelled) return
      if (!d) {
        setError('Attempt not found')
      } else {
        setDetail(d)
        setTeacherFeedback(d.attempt.teacherFeedback || '')
      }
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [attemptId])

  const handleScoreChange = useCallback((raw: number, band: number) => {
    setTeacherFinalRawScore(raw)
    setTeacherFinalBand(band)
  }, [])

  const handleWritingScoreChange = useCallback((score: MockWritingScore) => {
    setTeacherFinalWritingScore(score)
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Not found</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>The attempt you're looking for does not exist or has been deleted.</div>
        <Link href="/teacher/review" style={{ display: 'inline-flex', alignItems: 'center', background: '#4F46E5', color: '#FFFFFF', padding: '10px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          ← Back to queue
        </Link>
      </div>
    )
  }

  const { attempt, mock, student } = detail

  async function doPublish() {
    setIsPublishing(true)
    setPublishError(null)
    try {
      const overrides: any = { teacherFeedback }
      if (attempt.skill === 'writing' && teacherFinalWritingScore) {
        overrides.teacherFinalWritingScore = teacherFinalWritingScore
      } else if (teacherFinalRawScore !== undefined && teacherFinalBand !== undefined) {
        overrides.teacherFinalRawScore = teacherFinalRawScore
        overrides.teacherFinalBand = teacherFinalBand
      }
      await publishMockSectionAttempt(attempt.id, overrides)
      setPublishSuccess(true)
    } catch (err) {
      setPublishError('Failed to publish. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col" style={{ gap: 24 }}>
      <Link href="/teacher/review" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
        ← Back to queue
      </Link>
      
      <TeacherPageHero
        eyebrow="Mock Review"
        title={`${student.name} · ${mock.title}`}
        subtitle={`${capitalize(attempt.skill)} section · ${timeAgo(attempt.submittedAt)}`}
      />
        
        {attempt.skill === 'reading' && mock.reading && (
          <ReadingReviewDetail 
            reading={mock.reading} 
            attempt={attempt} 
            onScoreChange={handleScoreChange}
            teacherFeedback={teacherFeedback}
            onFeedbackChange={setTeacherFeedback}
          />
        )}
        {attempt.skill === 'listening' && mock.listening && (
          <ListeningReviewDetail 
            listening={mock.listening} 
            attempt={attempt} 
            onScoreChange={handleScoreChange}
            teacherFeedback={teacherFeedback}
            onFeedbackChange={setTeacherFeedback}
          />
        )}
        {attempt.skill === 'writing' && mock.writing && (
          <WritingReviewDetail 
            writing={mock.writing} 
            attempt={attempt} 
            onScoreChange={handleWritingScoreChange}
            teacherFeedback={teacherFeedback}
            onFeedbackChange={setTeacherFeedback}
          />
        )}

        {publishSuccess ? (
          <div style={{ marginTop: 32, padding: 24, background: '#D1FAE5', border: '1px solid #10B981', borderRadius: 12 }}>
            <h3 style={{ color: '#065F46', marginBottom: 8, marginTop: 0, fontSize: 18 }}>Published ✓</h3>
            <p style={{ color: '#065F46', marginBottom: 16 }}>
              {student.name} can now see their {attempt.skill} score on their dashboard.
              {MOCK_SECTION_POINTS} points have been added to their total.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => router.push('/teacher/review')}
                style={{ padding: '8px 16px', background: '#065F46', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer' }}
              >
                Back to queue
              </button>
              <a
                href={`/teacher/mock-reports/${attempt.mockExamId}/${attempt.studentId}`}
                target="_blank"
                rel="noopener"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#10B981', color: 'white', borderRadius: 6, fontSize: 14, textDecoration: 'none' }}
              >
                Print combined report
              </a>
            </div>
          </div>
        ) : attempt.status !== 'reviewed' ? (
          <div style={{ marginTop: 32, padding: 24, background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Ready to publish?</h3>
            <p style={{ color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
              Publishing releases the score to the student and updates their skill rating.
              Once published, the student will see their result.
            </p>
            {publishError && <div style={{ color: '#DC2626', marginBottom: 16, fontSize: 14 }}>{publishError}</div>}
            <button
              onClick={() => setShowPublishConfirm(true)}
              disabled={isPublishing}
              style={{
                padding: '12px 24px',
                background: '#4F46E5',
                color: 'white',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: isPublishing ? 'default' : 'pointer',
                opacity: isPublishing ? 0.7 : 1
              }}
            >
              {isPublishing ? 'Publishing…' : 'Publish to student'}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 32, padding: 24, background: '#D1FAE5', border: '1px solid #10B981', borderRadius: 12 }}>
            <h3 style={{ color: '#065F46', marginBottom: 8, marginTop: 0, fontSize: 18 }}>Already Published ✓</h3>
            <p style={{ color: '#065F46', marginBottom: 16 }}>
              This attempt has been reviewed and published. {student.name} can see their result.
            </p>
            <a
              href={`/teacher/mock-reports/${attempt.mockExamId}/${attempt.studentId}`}
              target="_blank"
              rel="noopener"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#10B981', color: 'white', borderRadius: 6, fontSize: 14, textDecoration: 'none' }}
            >
              Print combined report
            </a>
          </div>
        )}

      {showPublishConfirm && (
        <PublishConfirmDialog
          title="Publish this score?"
          body={`The student will see their score on their dashboard. ${MOCK_SECTION_POINTS} points will be added to their total. This cannot be undone.`}
          cancelLabel="Cancel"
          confirmLabel="Publish"
          onCancel={() => setShowPublishConfirm(false)}
          onConfirm={async () => {
            setShowPublishConfirm(false)
            await doPublish()
          }}
        />
      )}
    </div>
  )
}
