'use client'

import type { MockListeningQuestion } from '@/types/platform'

interface McqSingleQuestionProps {
  question: MockListeningQuestion
  questionNumberLabel: string
  value: string
  onChange: (value: string) => void
}

export default function McqSingleQuestion({ question, questionNumberLabel, value, onChange }: McqSingleQuestionProps) {
  const options = question.options || []

  return (
    <div className="bg-white p-6 rounded-[20px] border border-black/5 shadow-sm mb-5">
      <p className="font-body font-medium text-[22px] leading-relaxed mb-5 text-gray-900">
        Q{questionNumberLabel}. {question.question}
      </p>
      <div className="flex flex-col gap-4">
        {options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i)
          const isSelected = value === letter

          return (
            <button
              key={letter}
              onClick={() => onChange(letter)}
              className="flex items-center gap-5 p-5 rounded-[15px] text-left transition-all active:scale-[0.98] w-full"
              style={{
                minHeight: 70,
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.1)',
                background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'white',
              }}
            >
              <div 
                className="flex-shrink-0 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: isSelected ? 'var(--accent-primary)' : 'rgba(0,0,0,0.2)',
                  background: isSelected ? 'var(--accent-primary)' : 'transparent'
                }}
              >
                {isSelected && <div className="w-3.5 h-3.5 rounded-full bg-white" />}
              </div>
              <div>
                <span className="font-bold mr-3 text-gray-900 text-[19px]">{letter}</span>
                <span className="font-body text-[19px] text-gray-800">{opt}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
