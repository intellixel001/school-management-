'use client'

import { useEffect, useRef } from 'react'
import { User, Bot } from 'lucide-react'
import type { Message } from '@/types'

interface ConversationAreaProps {
  messages: Message[]
}

export default function ConversationArea({ messages }: ConversationAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Bot className="w-6 h-6 text-violet-400" />
        </div>
        <p className="text-violet-300 text-sm font-medium">Ready to start your session</p>
        <p className="text-violet-500 text-xs">Select a topic and press the mic to begin</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-2 py-2 overflow-y-auto h-full">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Avatar */}
          <div
            className={`
              flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
              ${msg.role === 'user'
                ? 'bg-violet-600/40 border border-violet-500/50'
                : 'bg-pink-600/30 border border-pink-500/40'
              }
            `}
          >
            {msg.role === 'user' ? (
              <User className="w-3.5 h-3.5 text-violet-300" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-pink-300" />
            )}
          </div>

          {/* Bubble */}
          <div
            className={`
              max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-violet-600/25 border border-violet-500/30 text-violet-100 rounded-tr-sm'
                : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
              }
            `}
          >
            {msg.content}
            <span className="block mt-1 text-[10px] text-white/20">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
