'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import type { ConversationItem, SpeakingState, ConnectionState } from '@/types/realtime'
import { MoreVertical, ArrowDown } from 'lucide-react'

interface VoiceTranscriptProps {
  conversationItems: ConversationItem[]
  speakingState: SpeakingState
  connectionState: ConnectionState
  orbStateColor: string
}

function MessageBubble({ item, isFirstInSequence }: { item: ConversationItem, isFirstInSequence: boolean }) {
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bubbleRef.current) return
    const isReduced = prefersReducedMotion()

    if (isReduced) {
      gsap.fromTo(bubbleRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 }
      )
    } else {
      gsap.fromTo(bubbleRef.current,
        {
          opacity: 0,
          y: 24,
          rotateX: -15,
          transformPerspective: 800,
          transformOrigin: 'center top',
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.55,
          ease: 'power3.out',
        }
      )
    }
  }, [])

  const isAI = item.role === 'assistant'

  return (
    <div
      ref={bubbleRef}
      style={{
        alignSelf: isAI ? 'flex-start' : 'flex-end',
        maxWidth: '86%',
        padding: '16px 20px',
        background: isAI 
          ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.10) 0%, rgba(52, 211, 153, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(96, 165, 250, 0.10) 0%, rgba(96, 165, 250, 0.04) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isAI 
          ? '1px solid rgba(52, 211, 153, 0.18)'
          : '1px solid rgba(96, 165, 250, 0.18)',
        borderLeft: isAI ? '3px solid rgba(52, 211, 153, 0.6)' : undefined,
        borderRight: !isAI ? '3px solid rgba(96, 165, 250, 0.6)' : undefined,
        borderRadius: isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      }}
    >
      {isFirstInSequence && (
        <div 
          className="font-mono"
          style={{ 
            fontSize: 'var(--type-mono-sm)', 
            textTransform: 'uppercase', 
            color: isAI ? 'var(--accent-voice)' : '#60A5FA', 
            opacity: 0.7,
            marginBottom: '4px'
          }}
        >
          {isAI ? 'TUTOR' : 'YOU'}
        </div>
      )}
      <div 
        className="font-display" 
        style={{ 
          fontSize: 'var(--type-body-lg)', 
          fontWeight: 400, 
          color: 'var(--text-primary)', 
          lineHeight: 1.55 
        }}
      >
        {item.transcript || (isAI ? '...' : '...')}
      </div>
    </div>
  )
}

function TypingIndicator() {
  const dot1Ref = useRef<HTMLDivElement>(null)
  const dot2Ref = useRef<HTMLDivElement>(null)
  const dot3Ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dot1Ref.current || !dot2Ref.current || !dot3Ref.current || !containerRef.current) return
    const isReduced = prefersReducedMotion()

    if (!isReduced) {
      gsap.fromTo(containerRef.current,
        {
          opacity: 0,
          y: 24,
          rotateX: -15,
          transformPerspective: 800,
          transformOrigin: 'center top',
        },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.55, ease: 'power3.out' }
      )

      const tl = gsap.timeline({ repeat: -1 })
      tl.to(dot1Ref.current, { scale: 1.4, duration: 0.3, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0)
        .to(dot2Ref.current, { scale: 1.4, duration: 0.3, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0.15)
        .to(dot3Ref.current, { scale: 1.4, duration: 0.3, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0.3)
    } else {
      gsap.set(containerRef.current, { opacity: 1 })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        alignSelf: 'flex-start',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.10) 0%, rgba(52, 211, 153, 0.04) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(52, 211, 153, 0.18)',
        borderLeft: '3px solid rgba(52, 211, 153, 0.6)',
        borderRadius: '18px 18px 18px 4px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        height: '56px'
      }}
    >
      <div ref={dot1Ref} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-voice)', opacity: 0.6 }} />
      <div ref={dot2Ref} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-voice)', opacity: 0.6 }} />
      <div ref={dot3Ref} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-voice)', opacity: 0.6 }} />
    </div>
  )
}

export default function VoiceTranscript({ conversationItems, speakingState, connectionState, orbStateColor }: VoiceTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollPill, setShowScrollPill] = useState(false)
  
  // Custom scrollbar style
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .transcript-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .transcript-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .transcript-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Auto-scroll logic
  const lastItemCount = useRef(conversationItems.length)
  
  const isAiTyping = speakingState === 'ai_speaking' && (conversationItems.length === 0 || conversationItems[conversationItems.length - 1].role !== 'assistant')

  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    
    const isNewMessage = conversationItems.length > lastItemCount.current
    const itemsChanged = isNewMessage || isAiTyping
    lastItemCount.current = conversationItems.length

    if (itemsChanged) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        setShowScrollPill(false)
      } else if (isNewMessage) {
        setShowScrollPill(true)
      }
    }
  }, [conversationItems.length, isAiTyping])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    if (isNearBottom && showScrollPill) {
      setShowScrollPill(false)
    }
  }

  const handleScrollPillClick = () => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    setShowScrollPill(false)
  }

  const handlePointerDownGhost = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 0.94, backgroundColor: 'rgba(255,255,255,0.06)', duration: 0.1 })
  }
  const handlePointerUpGhost = (e: React.PointerEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 1, backgroundColor: 'transparent', duration: 0.2 })
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '96px',
        bottom: '96px',
        right: '32px',
        width: '440px',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(32px) saturate(160%)',
        WebkitBackdropFilter: 'blur(32px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '28px',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {/* Header Strip */}
      <div 
        style={{ 
          height: '56px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 16px 0 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: orbStateColor,
              boxShadow: `0 0 8px ${orbStateColor}`
            }} 
          />
          <span className="font-display" style={{ fontSize: 'var(--type-body-md)', fontWeight: 500, color: 'var(--text-primary)' }}>
            Conversation
          </span>
        </div>
        <button
          onPointerDown={handlePointerDownGhost}
          onPointerUp={handlePointerUpGhost}
          onPointerLeave={handlePointerUpGhost}
          onPointerCancel={handlePointerUpGhost}
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Scroll Area */}
      <div 
        ref={scrollRef}
        className="transcript-scroll"
        onScroll={handleScroll}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {conversationItems.length === 0 && connectionState === 'connected' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: orbStateColor,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} 
            />
            <div className="font-display" style={{ fontSize: 'var(--type-body-md)', fontWeight: 400, color: 'var(--text-muted)' }}>
              Say hello to begin
            </div>
            <div className="font-mono" style={{ fontSize: 'var(--type-mono-sm)', opacity: 0.5, color: 'var(--text-primary)' }}>
              AI IS LISTENING
            </div>
          </div>
        )}

        {conversationItems.map((item, index) => {
          const prevItem = index > 0 ? conversationItems[index - 1] : null
          const isFirstInSequence = !prevItem || prevItem.role !== item.role
          return (
            <MessageBubble 
              key={item.id || index} 
              item={item} 
              isFirstInSequence={isFirstInSequence} 
            />
          )
        })}

        {isAiTyping && <TypingIndicator />}
      </div>

      {/* New Message Pill */}
      {showScrollPill && (
        <button
          onClick={handleScrollPillClick}
          onPointerDown={handlePointerDownGhost}
          onPointerUp={handlePointerUpGhost}
          onPointerLeave={handlePointerUpGhost}
          className="font-body"
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '999px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary)',
            fontSize: 'var(--type-body-sm)',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <ArrowDown size={14} /> New message
        </button>
      )}
    </div>
  )
}
