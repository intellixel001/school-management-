'use client'

import type { MockListeningQuestion } from '@/types/platform'

interface MatchingQuestionProps {
  question: MockListeningQuestion
  questionNumberLabel: string
  value: string
  onChange: (value: string) => void
}

export default function MatchingQuestion({ question, questionNumberLabel, value, onChange }: MatchingQuestionProps) {
  const options = question.matchingOptions || []

  return (
    <div className="bg-white p-6 rounded-[20px] border border-black/5 shadow-sm mb-5">
      <p className="font-body font-medium text-[22px] leading-relaxed mb-5 text-gray-900">
        Q{questionNumberLabel}. {question.question}
      </p>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white font-body text-[20px] text-gray-900"
          style={{
            minHeight: 70,
            padding: '18px 50px 18px 20px',
            borderRadius: 12,
            border: value ? '1.5px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.12)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="" disabled>— Select a feature —</option>
          {options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            return (
              <option key={letter} value={letter}>
                {letter}. {opt}
              </option>
            )
          })}
        </select>
        
        {/* Custom dropdown arrow to replace native one */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  )
}
