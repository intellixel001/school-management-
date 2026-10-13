'use client'

/**
 * @file app/kiosk/voice/_components/ChatBubble.tsx
 * @description Single message bubble for the AI voice tutor chat panel.
 * Kept intentionally simple: role-driven alignment + colour + subtle glow.
 * Sized for the 40.7" portrait kiosk (large touch-friendly typography).
 */

import { Bot } from 'lucide-react'

export type ChatRole = 'user' | 'assistant'

interface ChatBubbleProps {
  role: ChatRole
  text: string
  /** True while this is the freshest AI turn currently being read aloud. */
  speaking?: boolean
}

const VOICE_ACCENT = '#34D399'          // mint — matches the voice tutor theme
const USER_TINT   = 'rgba(52, 211, 153, 0.14)'
const USER_BORDER = 'rgba(52, 211, 153, 0.30)'
const AI_TINT     = 'rgba(96, 165, 250, 0.12)'
const AI_BORDER   = 'rgba(96, 165, 250, 0.28)'

export default function ChatBubble({ role, text, speaking }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        gap: 16,
        width: '100%',
      }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div
          style={{
            flexShrink: 0,
            width: 56, height: 56, borderRadius: 20,
            background: `linear-gradient(135deg, ${VOICE_ACCENT} 0%, #60A5FA 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: speaking
              ? `0 0 24px ${VOICE_ACCENT}, 0 0 48px rgba(52, 211, 153, 0.3)`
              : '0 4px 16px rgba(0, 0, 0, 0.35)',
            transition: 'box-shadow 240ms ease',
          }}
        >
          <Bot size={30} color="#0A1628" strokeWidth={2.2} />
        </div>
      )}

      <div
        className="font-body"
        style={{
          maxWidth: '78%',
          padding: '18px 24px',
          borderRadius: 22,
          background: isUser ? USER_TINT : AI_TINT,
          border: `1px solid ${isUser ? USER_BORDER : AI_BORDER}`,
          color: '#F1F5F9',
          fontSize: 22,
          lineHeight: 1.55,
          letterSpacing: '0.005em',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </div>
    </div>
  )
}
