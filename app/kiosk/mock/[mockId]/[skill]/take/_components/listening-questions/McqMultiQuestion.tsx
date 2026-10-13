'use client'

import type { MockListeningQuestion } from '@/types/platform'
import { CheckSquare, Square } from 'lucide-react'

interface McqMultiQuestionProps {
  question: MockListeningQuestion
  questionNumberLabel: string
  value: string[]
  onChange: (value: string[]) => void
}

export default function McqMultiQuestion({ question, questionNumberLabel, value, onChange }: McqMultiQuestionProps) {
  const options = question.options || []
  const maxSelect = question.numberToSelect ?? 2

  function toggle(letter: string) {
    const isSelected = value.includes(letter)
    if (isSelected) {
      onChange(value.filter(v => v !== letter))
    } else {
      if (value.length >= maxSelect) return // silent prevent
      onChange([...value, letter].sort())
    }
  }

  return (
    <div className="bg-white p-6 rounded-[20px] border border-black/5 shadow-sm mb-5">
      <p className="font-body font-medium text-[22px] leading-relaxed mb-5 text-gray-900">
        Questions {questionNumberLabel}. {question.question}
      </p>
      <div className="flex flex-col gap-4">
        {options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i)
          const isSelected = value.includes(letter)

          return (
            <button
              key={letter}
              onClick={() => toggle(letter)}
              className="flex items-center gap-5 p-5 rounded-[15px] text-left transition-all active:scale-[0.98] w-full"
              style={{
                minHeight: 70,
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.1)',
                background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'white',
              }}
            >
              <div className="flex-shrink-0 text-gray-400 transition-colors" style={{ color: isSelected ? 'var(--accent-primary)' : 'rgba(0,0,0,0.3)' }}>
                {isSelected ? <CheckSquare size={30} /> : <Square size={30} />}
              </div>
              <div>
                <span className="font-bold mr-3 text-gray-900 text-[19px]">{letter}</span>
                <span className="font-body text-[19px] text-gray-800">{opt}</span>
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-5 font-mono text-lg" style={{ color: value.length === maxSelect ? 'var(--accent-primary)' : '#6b7280' }}>
        {value.length} of {maxSelect} selected
      </div>
    </div>
  )
}
