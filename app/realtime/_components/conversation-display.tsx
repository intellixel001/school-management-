/**
 * @file app/realtime/_components/conversation-display.tsx
 * @description Scrollable conversation transcript showing user and assistant
 * messages as chat bubbles. Streams assistant text incrementally as delta events
 * arrive (ConversationItem transcripts update in place via the events hook).
 *
 * Phase 5 additions:
 * - Caps display to last 50 items for performance (older messages silently drop).
 * - Empty state message updates based on `isConnected` and `speakingState`.
 * - Bouncing-dot typing indicator shows while assistant transcript is empty.
 */

'use client'

import { useEffect, useRef } from 'react'
import type { ConversationItem, SpeakingState } from '@/types/realtime'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_DISPLAYED_ITEMS = 50

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationDisplayProps {
  conversationItems: ConversationItem[]
  isConnected: boolean
  speakingState: SpeakingState
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <span className="flex items-center gap-1.5 py-0.5">
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce motion-reduce:animate-none [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce motion-reduce:animate-none [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce motion-reduce:animate-none [animation-delay:300ms]" />
    </span>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ item }: { item: ConversationItem }) {
  const isUser  = item.role === 'user'
  const isEmpty = item.transcript === ''

  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] text-brand-muted/70 px-1 font-medium tracking-wide uppercase">
        {isUser ? 'You' : 'Assistant'} ·{' '}
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>

      <div
        className={[
          'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-200',
          isUser
            ? 'bg-brand-primary/30 text-[#e9d5ff] rounded-br-sm border border-brand-primary/20'
            : 'bg-white/[0.07] text-brand-text rounded-bl-sm border border-white/[0.06]',
          isEmpty ? 'opacity-50' : 'opacity-100',
        ].join(' ')}
      >
        {isEmpty
          ? isUser
            ? <span className="text-[11px] italic text-brand-muted/60 animate-pulse">Transcribing...</span>
            : <TypingIndicator />
          : item.transcript}
      </div>
    </div>
  )
}

// ─── Conversation display ─────────────────────────────────────────────────────

export function ConversationDisplay({
  conversationItems,
  isConnected,
  speakingState,
}: ConversationDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Cap to last MAX_DISPLAYED_ITEMS for rendering performance
  const visibleItems =
    conversationItems.length > MAX_DISPLAYED_ITEMS
      ? conversationItems.slice(-MAX_DISPLAYED_ITEMS)
      : conversationItems

  // Auto-scroll to bottom whenever items or transcript content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [conversationItems])

  // Derive empty-state message
  let emptyMessage = 'Tap Start Conversation to begin'
  if (isConnected) {
    emptyMessage =
      speakingState === 'ai_speaking'
        ? 'Assistant is speaking…'
        : "I'm listening — go ahead and speak"
  }

  return (
    <section
      aria-label="Conversation transcript"
      aria-live="polite"
      aria-relevant="additions"
      className="flex-1 min-h-0 overflow-y-auto px-4 py-6 flex flex-col gap-4 scroll-smooth"
    >
      {visibleItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none">
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-brand-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <p className="text-sm text-brand-muted text-center max-w-[220px]">
            {emptyMessage}
          </p>
        </div>
      ) : (
        visibleItems.map((item) => <MessageBubble key={item.id} item={item} />)
      )}
      <div ref={bottomRef} />
    </section>
  )
}
