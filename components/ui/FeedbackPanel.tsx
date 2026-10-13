'use client'

import type { FeedbackItem } from '@/types'

interface FeedbackPanelProps {
  feedback: FeedbackItem[]
}

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">
        AI Feedback
      </h3>

      {feedback.length === 0 ? (
        <p className="text-[11px] text-violet-600 italic">Tutor feedback will appear after each exchange…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {feedback.map((item, i) => (
            <div
              key={i}
              className="flex gap-2 items-start px-3 py-2 rounded-xl bg-white/5 border border-white/10"
            >
              <span className="text-sm flex-shrink-0 leading-none mt-0.5">{item.icon}</span>
              <p className="text-[11px] text-gray-300 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
