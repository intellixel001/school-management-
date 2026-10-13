'use client'

import { useEffect, useRef } from 'react'
import type { Message, FeedbackItem } from '@/types'

interface ChatMessage extends Message {
  vocab?: string[]
  feedback?: FeedbackItem[]
  score?: number
  options?: string[]
}

interface ChatTranscriptProps {
  messages: ChatMessage[]
  isAITyping: boolean
  onOptionClick?: (option: string) => void
  optionsDisabled?: boolean
}

const LETTER = ['A', 'B', 'C', 'D', 'E', 'F']

export default function ChatTranscript({
  messages,
  isAITyping,
  onOptionClick,
  optionsDisabled = false,
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAITyping])

  const lastAIIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i
    }
    return -1
  })()

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10" style={{ minHeight: 0, paddingBottom: 64 }}>
      {messages.map((msg, idx) => {
        const isLastAI = idx === lastAIIndex
        return (
          <div
            key={msg.id}
            className="flex flex-col"
            style={{
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* Message bubble */}
            <div
              className="font-body"
              style={{
                padding: '16px 24px',
                borderRadius: '20px',
                fontSize: 16,
                lineHeight: 1.6,
                boxShadow: msg.role === 'assistant' ? '0 12px 32px rgba(0,0,0,0.03)' : '0 12px 32px color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                ...(msg.role === 'user'
                  ? {
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      borderBottomRightRadius: '6px',
                    }
                  : {
                      background: '#ffffff',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(0,0,0,0.02)',
                      borderBottomLeftRadius: '6px',
                    }),
              }}
            >
              {msg.content}
            </div>

            {/* MCQ option buttons */}
            {msg.role === 'assistant' && msg.options && msg.options.length > 0 && (
              <div className="flex flex-col gap-3 mt-4" style={{ width: '100%', minWidth: 320, paddingLeft: 8 }}>
                {msg.options.map((opt, i) => {
                  const interactive = isLastAI && !optionsDisabled
                  return (
                    <button
                      key={`${msg.id}-opt-${i}`}
                      onClick={() => interactive && onOptionClick?.(opt)}
                      disabled={!interactive}
                      // Note: We remove any hover: styles. Only active scales are used.
                      className={`font-body text-left outline-none ${interactive ? 'active:scale-[0.98]' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '18px 24px',
                        borderRadius: '16px',
                        background: '#ffffff',
                        border: `1.5px solid ${interactive ? 'color-mix(in srgb, var(--accent-primary) 30%, transparent)' : 'rgba(0,0,0,0.05)'}`,
                        boxShadow: interactive ? '0 8px 24px rgba(0,0,0,0.03)' : 'none',
                        color: interactive ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: 16,
                        minHeight: 64,
                        transition: 'transform 0.1s ease',
                        cursor: interactive ? 'pointer' : 'default',
                        opacity: interactive ? 1 : 0.6,
                      }}
                    >
                      <span
                        className="font-display font-bold"
                        style={{
                          fontSize: 14,
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-full)',
                          background: interactive
                            ? 'var(--accent-primary)'
                            : '#f4f4f5',
                          color: interactive ? '#ffffff' : 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {LETTER[i] ?? String(i + 1)}
                      </span>
                      <span className="font-medium" style={{ flex: 1, lineHeight: 1.5 }}>{opt}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Vocab chips */}
            {msg.role === 'assistant' && msg.vocab && msg.vocab.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pl-2">
                {msg.vocab.map((word) => (
                  <span
                    key={word}
                    className="font-mono font-semibold"
                    style={{
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                      color: 'var(--accent-primary)',
                      border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)'
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}

            {/* Feedback items */}
            {msg.role === 'assistant' && msg.feedback && msg.feedback.length > 0 && (
              <div className="flex flex-col gap-2 mt-3 pl-2" style={{ fontSize: 14 }}>
                {msg.feedback.map((fb, i) => (
                  <div key={i} className="font-body flex gap-2 items-center" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: 18 }}>{fb.icon}</span>
                    <span style={{ fontWeight: 500 }}>{fb.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Score */}
            {msg.role === 'assistant' && msg.score != null && (
              <div
                className="font-mono font-bold mt-3 pl-2"
                style={{
                  fontSize: 14,
                  color: 'var(--accent-primary)',
                  padding: '4px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                  display: 'inline-block'
                }}
              >
                Score: {msg.score}/100
              </div>
            )}
          </div>
        )
      })}

      {/* Thinking indicator */}
      {isAITyping && (
        <div 
          className="flex items-center gap-2 self-start" 
          style={{ 
            padding: '16px 24px', 
            background: '#ffffff', 
            borderRadius: '20px', 
            borderBottomLeftRadius: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.02)'
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'color-mix(in srgb, var(--accent-primary) 50%, transparent)',
                animation: 'dotPulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
