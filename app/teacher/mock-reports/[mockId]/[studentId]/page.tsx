'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getMockExam, getStudentMockAttempts, getStudentById } from '@/lib/services'
import { overallMockBand } from '@/lib/scoring/ieltsBands'
import type { MockExam, MockSectionAttempt, Student, MockReadingTest, MockListeningTest, MockWritingTest } from '@/types/platform'
import './print.css'

export default function MockReportPage() {
  const params = useParams()
  const mockId = params.mockId as string
  const studentId = params.studentId as string

  const [mock, setMock] = useState<MockExam | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [attempts, setAttempts] = useState<MockSectionAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMockExam(mockId),
      getStudentById(studentId),
      getStudentMockAttempts(studentId),
    ]).then(([m, s, a]) => {
      setMock(m)
      setStudent(s)
      setAttempts(a.filter(att => att.mockExamId === mockId))
      setLoading(false)
    })
  }, [mockId, studentId])

  if (loading) return <div className="p-8 text-center">Loading report...</div>
  if (!mock || !student) return <div className="p-8 text-center text-red-600">Report not found</div>

  const readingAttempt = attempts.find(a => a.skill === 'reading')
  const listeningAttempt = attempts.find(a => a.skill === 'listening')
  const writingAttempt = attempts.find(a => a.skill === 'writing')

  return (
    <CombinedReport 
      mock={mock} 
      student={student} 
      reading={readingAttempt} 
      listening={listeningAttempt} 
      writing={writingAttempt} 
    />
  )
}

function CombinedReport({
  mock, student, reading, listening, writing
}: {
  mock: MockExam, student: Student, reading?: MockSectionAttempt, listening?: MockSectionAttempt, writing?: MockSectionAttempt
}) {
  const overall = overallMockBand({
    reading: reading?.status === 'reviewed' ? reading.teacherFinalBand ?? null : null,
    listening: listening?.status === 'reviewed' ? listening.teacherFinalBand ?? null : null,
    writing: writing?.status === 'reviewed' ? writing.teacherFinalWritingScore?.bands.overallBand ?? null : null,
  })
  
  const date = (reading?.reviewedAt || listening?.reviewedAt || writing?.reviewedAt || new Date().toISOString()).split('T')[0]
  const totalDuration = (reading?.durationSeconds || 0) + (listening?.durationSeconds || 0) + (writing?.durationSeconds || 0)
  const hrs = Math.floor(totalDuration / 3600)
  const mins = Math.floor((totalDuration % 3600) / 60)
  const formattedTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`

  const allReviewed = [reading, listening, writing].every(a => a?.status === 'reviewed')
  const completedCount = [reading, listening, writing].filter(a => a?.status === 'reviewed').length

  return (
    <div className="mock-report">
      <PrintButton />
      
      <div className="mb-8">
        <div className="text-xl font-bold mb-1">NELSON COLLEGE LONDON</div>
        <div className="text-gray-600 text-sm">Mock Assessment Report</div>
      </div>
      
      <hr className="mb-8" />
      
      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div>
          <div><strong>Candidate:</strong> {student.name}</div>
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Level:</strong> {student.level}</div>
        </div>
        <div>
          <div><strong>Mock:</strong> {mock.title}</div>
          <div><strong>Date:</strong> {date}</div>
          <div><strong>Total time:</strong> {formattedTime}</div>
        </div>
      </div>
      
      <hr className="mb-8" />
      
      <div className="mb-12">
        <h2>OVERALL</h2>
        <div className="text-lg mb-6">
          Overall Mock Band:{' '}
          <strong>
            {overall !== null ? overall.toFixed(1) : 'Pending'} 
            {overall !== null && !allReviewed && <span className="text-sm font-normal text-gray-500 ml-2">({completedCount} of 3 sections reviewed)</span>}
          </strong>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>Band</th>
              <th>Raw Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Reading</td>
              <td>{reading?.status === 'reviewed' && reading.teacherFinalBand !== null ? reading.teacherFinalBand.toFixed(1) : '-'}</td>
              <td>{reading?.status === 'reviewed' && reading.teacherFinalRawScore !== null ? `${reading.teacherFinalRawScore} / ${reading.totalQuestions}` : 'Pending'}</td>
            </tr>
            <tr>
              <td>Listening</td>
              <td>{listening?.status === 'reviewed' && listening.teacherFinalBand !== null ? listening.teacherFinalBand.toFixed(1) : '-'}</td>
              <td>{listening?.status === 'reviewed' && listening.teacherFinalRawScore !== null ? `${listening.teacherFinalRawScore} / ${listening.totalQuestions}` : 'Pending'}</td>
            </tr>
            <tr>
              <td>Writing</td>
              <td>{writing?.status === 'reviewed' && writing.teacherFinalWritingScore ? writing.teacherFinalWritingScore.bands.overallBand.toFixed(1) : '-'}</td>
              <td>{writing?.status === 'reviewed' ? 'See below' : 'Pending'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="report-section">
        <h2>READING SECTION</h2>
        {!reading || reading.status !== 'reviewed' ? (
          <p className="text-gray-500 italic">Not yet reviewed.</p>
        ) : (
          <ReadingReportSection attempt={reading} mockReading={mock.reading} />
        )}
      </div>

      <div className="report-section">
        <h2>LISTENING SECTION</h2>
        {!listening || listening.status !== 'reviewed' ? (
          <p className="text-gray-500 italic">Not yet reviewed.</p>
        ) : (
          <ListeningReportSection attempt={listening} mockListening={mock.listening} />
        )}
      </div>

      <div className="report-section">
        <h2>WRITING SECTION</h2>
        {!writing || writing.status !== 'reviewed' ? (
          <p className="text-gray-500 italic">Not yet reviewed.</p>
        ) : (
          <WritingReportSection attempt={writing} mockWriting={mock.writing} />
        )}
      </div>
      
      <div className="signature-line">
        <div className="flex justify-between text-sm">
          <div>Examiner signature: ________________________</div>
          <div>Date: {date}</div>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-400 text-center">
        Generated by English AI Tutor · Nelson College London
      </div>
    </div>
  )
}

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-hide"
      style={{ position: 'fixed', top: 20, right: 20, padding: '10px 20px', background: '#4F46E5', color: 'white', borderRadius: 8, zIndex: 10, cursor: 'pointer', border: 'none', fontWeight: 600 }}
    >
      🖨 Print this report
    </button>
  )
}

function ReadingReportSection({ attempt, mockReading }: { attempt: MockSectionAttempt, mockReading: MockReadingTest | null }) {
  if (!mockReading) return null
  const mins = Math.floor((attempt.durationSeconds || 0) / 60)
  
  return (
    <div>
      <div className="text-sm mb-4">
        <div><strong>Passage:</strong> {mockReading.passageTitle}</div>
        <div><strong>Time taken:</strong> {mins} minutes</div>
        <div><strong>Raw score:</strong> {attempt.teacherFinalRawScore} / {attempt.totalQuestions}</div>
        <div><strong>IELTS Band:</strong> {attempt.teacherFinalBand?.toFixed(1)}</div>
      </div>
      
      <h4>Per-question breakdown:</h4>
      <div className="text-sm mb-6 max-h-96 overflow-y-auto print:max-h-none print:overflow-visible border border-gray-200 rounded p-4">
        {mockReading.questions.map((q, i) => {
          const studentAns = attempt.answers[q.id]
          // In real implementation, we might compare correctly here or rely on the fact that teacherFinalRawScore exists
          // Since we don't store per-question correctness after teacher override cleanly for R/L, we'll show their answer and correct answer.
          const isCorrectStr = String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
          return (
            <div key={q.id} className="mb-2">
              <span>{isCorrectStr ? '✓' : '✗'} <strong>Q{i + 1}</strong> — Student: {String(studentAns || '(blank)')} | Correct: {String(q.correctAnswer)}</span>
            </div>
          )
        })}
      </div>
      
      {attempt.teacherFeedback && (
        <div className="mt-6">
          <h4>Teacher's feedback:</h4>
          <p className="whitespace-pre-wrap text-sm border-l-4 border-gray-300 pl-4 py-1">{attempt.teacherFeedback}</p>
        </div>
      )}
    </div>
  )
}

function ListeningReportSection({ attempt, mockListening }: { attempt: MockSectionAttempt, mockListening: MockListeningTest | null }) {
  if (!mockListening) return null
  const mins = Math.floor((attempt.durationSeconds || 0) / 60)
  
  return (
    <div>
      <div className="text-sm mb-4">
        <div><strong>Audio:</strong> {mockListening.recordings?.[0]?.title || 'Audio test'}</div>
        <div><strong>Time taken:</strong> {mins} minutes</div>
        <div><strong>Raw score:</strong> {attempt.teacherFinalRawScore} / {attempt.totalQuestions}</div>
        <div><strong>IELTS Band:</strong> {attempt.teacherFinalBand?.toFixed(1)}</div>
      </div>
      
      <h4>Per-question breakdown:</h4>
      <div className="text-sm mb-6 max-h-96 overflow-y-auto print:max-h-none print:overflow-visible border border-gray-200 rounded p-4">
        {mockListening.questions.map((q, i) => {
          const studentAns = attempt.answers[q.id]
          // Basic string compare for display logic
          let isCorrectStr = false
          if (Array.isArray(q.correctAnswer) && Array.isArray(studentAns)) {
            isCorrectStr = q.correctAnswer.length === studentAns.length && q.correctAnswer.every(x => studentAns.includes(x))
          } else {
            isCorrectStr = String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
          }
          
          return (
            <div key={q.id} className="mb-2">
              <span>{isCorrectStr ? '✓' : '✗'} <strong>Q{i + 1}</strong> — Student: {Array.isArray(studentAns) ? studentAns.join(', ') : String(studentAns || '(blank)')} | Correct: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer)}</span>
            </div>
          )
        })}
      </div>
      
      {attempt.teacherFeedback && (
        <div className="mt-6">
          <h4>Teacher's feedback:</h4>
          <p className="whitespace-pre-wrap text-sm border-l-4 border-gray-300 pl-4 py-1">{attempt.teacherFeedback}</p>
        </div>
      )}
    </div>
  )
}

function WritingReportSection({ attempt, mockWriting }: { attempt: MockSectionAttempt, mockWriting: MockWritingTest | null }) {
  if (!mockWriting) return null
  const submission = attempt.answers['writing-response'] as string || ''
  const wordCount = submission.split(/\s+/).filter(Boolean).length
  const score = attempt.teacherFinalWritingScore
  
  return (
    <div>
      <div className="text-sm mb-6">
        <div><strong>Prompt:</strong> {mockWriting.prompt}</div>
        <div><strong>Word count:</strong> {wordCount} (min words: {mockWriting.minWords})</div>
      </div>
      
      {score && (
        <div className="mb-6">
          <h4>EXAMINER'S ASSESSMENT</h4>
          <table style={{ width: 'auto', minWidth: '300px' }}>
            <tbody>
              <tr><td>Task Response</td><td>{score.bands.taskResponse.toFixed(1)}</td></tr>
              <tr><td>Coherence & Cohesion</td><td>{score.bands.coherenceCohesion.toFixed(1)}</td></tr>
              <tr><td>Lexical Resource</td><td>{score.bands.lexicalResource.toFixed(1)}</td></tr>
              <tr><td>Grammar & Accuracy</td><td>{score.bands.grammaticalRange.toFixed(1)}</td></tr>
            </tbody>
          </table>
          <div className="font-bold mt-2 mb-4">Overall Band: {score.bands.overallBand.toFixed(1)}</div>
          
          <div className="text-sm mb-4">
            <strong>Flags:</strong>{' '}
            <span className="mr-4">{score.flags.underlength ? '☑' : '☐'} UNDERLENGTH</span>
            <span className="mr-4">{score.flags.offTopic ? '☑' : '☐'} OFF-TOPIC</span>
            <span>{score.flags.memorised ? '☑' : '☐'} MEMORISED</span>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h4>Student's response:</h4>
        <div className="text-sm border border-gray-200 p-4 rounded whitespace-pre-wrap bg-gray-50">{submission || '(blank)'}</div>
      </div>
      
      {attempt.teacherFeedback && (
        <div className="mt-6">
          <h4>Teacher's feedback:</h4>
          <p className="whitespace-pre-wrap text-sm border-l-4 border-gray-300 pl-4 py-1">{attempt.teacherFeedback}</p>
        </div>
      )}
    </div>
  )
}
