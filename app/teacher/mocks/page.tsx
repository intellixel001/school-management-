'use client'

import { useEffect, useState } from 'react'
import { 
  getPendingMockReviews, 
  setReattemptAllowed, 
  getStudentMockAttempts, 
  getMockExams, 
  getStudents, 
  type MockReviewDetail 
} from '@/lib/services'
import { Spinner } from '@/components/ui'
import { TeacherPageHero } from '../_components/TeacherPageHero'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function ManageMocksPage() {
  const [attempts, setAttempts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [allAttempts, allMocks, allStudents] = await Promise.all([
          getStudentMockAttempts(),
          getMockExams(),
          getStudents(),
        ])
        if (cancelled) return

        // List all attempts that have been submitted/reviewed
        const validAttempts = allAttempts.filter(a => 
          a.status === 'submitted' || a.status === 'ai-graded' || a.status === 'reviewed'
        )
        
        const enriched = validAttempts.map(a => {
          const student = allStudents.find(s => s.id === a.studentId)
          const mock = allMocks.find(m => m.id === a.mockExamId)
          return { ...a, student, mock }
        }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        
        setAttempts(enriched)
      } catch (err) {
        console.error('Failed to load mocks data', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleToggle(attemptId: string, currentVal: boolean) {
    try {
      await setReattemptAllowed(attemptId, !currentVal)
      setAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, allowReattempt: !currentVal } : a))
    } catch (err) {
      alert('Failed to update setting')
    }
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-6 py-8" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <TeacherPageHero
          eyebrow="Settings"
          title="Manage Mocks"
          subtitle="By default, students get ONE attempt per mock section. Toggle below to allow specific students to re-take a section after submission."
        />

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 14, overflow: 'hidden'
        }}>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500">Student</th>
                <th className="px-6 py-4 font-medium text-gray-500">Mock</th>
                <th className="px-6 py-4 font-medium text-gray-500">Skill</th>
                <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 font-medium text-gray-500">Allow Re-attempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{a.student?.name || a.studentId}</td>
                  <td className="px-6 py-4">{a.mock?.title || a.mockExamId}</td>
                  <td className="px-6 py-4">{capitalize(a.skill)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={a.allowReattempt || false}
                          onChange={() => handleToggle(a.id, a.allowReattempt || false)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${a.allowReattempt ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${a.allowReattempt ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                    </label>
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No mock attempts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
