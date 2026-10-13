'use client'

import { useState, useEffect } from 'react'
import type { SkillArea } from '@/types/platform'
import type { ReadingPassage, WritingPrompt, SpeakingTopic, ListeningPassage } from '@/types/platform'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { Badge } from '@/components/ui'
import dynamic from 'next/dynamic'

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type ContentItem = ReadingPassage | WritingPrompt | SpeakingTopic | ListeningPassage

interface SessionIntroScreenProps {
  skill: SkillArea
  levelShort: string
  content: ContentItem
  onStart: () => void
}

export default function SessionIntroScreen({ skill, levelShort, content, onStart }: SessionIntroScreenProps) {
  const config = SKILL_CONFIG[skill]
  const Icon = config.icon
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    fetch(`/icons/${skill}.json`)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load Lottie animation:", err))
  }, [skill])

  return (
    <div 
      className="flex flex-col items-center justify-center w-full h-full" 
      style={{ 
        overflow: 'auto', 
        padding: '24px', 
        background: 'transparent' // Inherit from parent data-theme="dark"
      }}
    >
      {/* Skill header with Animated Icon */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="flex items-center justify-center mb-5"
          style={{
            width: 120, height: 120, // slightly larger so it looks good without the container
          }}
        >
          {animationData ? (
            <Lottie animationData={animationData} loop={false} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Icon size={40} style={{ color: config.iconColor }} />
          )}
        </div>
        <div className="flex items-center gap-4">
          <h2 className="font-display font-bold" style={{ fontSize: 64, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            {config.label}
          </h2>
          <Badge variant="default" size="md" style={{ transform: 'scale(1.2)', transformOrigin: 'left' }}>{levelShort}</Badge>
        </div>
      </div>

      {/* Instruction */}
      <p className="font-body text-center" style={{ fontSize: 28, color: 'var(--text-secondary)', maxWidth: 1000, marginBottom: 56, lineHeight: 1.6 }}>
        {config.instruction}
      </p>

      {/* Content preview — skill-conditional */}
      <div style={{ width: '100%', maxWidth: 1000, marginBottom: 56 }}>
        {skill === 'reading' && (() => {
          return null
        })()}

        {skill === 'writing' && (() => {
          const c = content as WritingPrompt
          return (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '24px', 
                padding: '48px', 
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
              }}
            >
              <h3 className="font-display font-bold" style={{ fontSize: 36, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                {c.title}
              </h3>
              <p className="font-body" style={{ fontSize: 24, color: 'var(--text-muted)', margin: '0 0 28px' }}>
                5 short writing tasks · complete all to finish the session
              </p>
              {c.tasks && c.tasks.length > 0 ? (
                <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {c.tasks.map((t, i) => (
                    <li key={t.id} className="font-body" style={{ fontSize: 24, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <span className="font-mono font-bold" style={{ fontSize: 20, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 8 }}>Task {i + 1}</span>
                      {t.instruction}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="font-body" style={{ fontSize: 28, color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {c.prompt}
                </p>
              )}
            </div>
          )
        })()}

        {skill === 'speaking' && (() => {
          const c = content as SpeakingTopic
          return (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '24px', 
                padding: '48px', 
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
              }}
            >
              <h3 className="font-display font-bold" style={{ fontSize: 36, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                {c.title}
              </h3>
              <p className="font-body" style={{ fontSize: 24, color: 'var(--text-muted)', margin: '0 0 28px' }}>
                5 spoken tasks · tap to record, review, then submit each one
              </p>
              {c.tasks && c.tasks.length > 0 ? (
                <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {c.tasks.map((t, i) => (
                    <li key={t.id} className="font-body" style={{ fontSize: 24, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <span className="font-mono font-bold" style={{ fontSize: 20, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 8 }}>Task {i + 1}</span>
                      {t.instruction}
                    </li>
                  ))}
                </ol>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-mono" style={{ fontSize: 20, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opening prompt</span>
                  <p className="font-body font-medium" style={{ fontSize: 28, color: 'var(--text-primary)', margin: '16px 0 0', lineHeight: 1.6 }}>
                    &ldquo;{c.openingPrompt}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        {skill === 'listening' && (
          <div
            style={{
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '32px', 
              padding: '64px 48px', 
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 100, marginBottom: 32 }}>🎧</div>
            <p className="font-display font-medium" style={{ fontSize: 32, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
              The AI tutor will read a passage aloud.
              <br/><br/>
              <span className="font-body" style={{ color: 'var(--text-secondary)', fontSize: 28 }}>Listen carefully, then answer the questions that follow.</span>
            </p>
          </div>
        )}
      </div>

      {/* Start button - Custom designed to strictly avoid hover effects for touch */}
      <button 
        onClick={onStart}
        className="font-display font-bold active:scale-[0.97] outline-none select-none flex items-center justify-center" 
        style={{ 
          width: '100%', 
          maxWidth: 600,
          padding: '32px 80px',
          background: 'linear-gradient(180deg, #D4A352 0%, #A6732B 100%)',
          border: '1px solid #8C5D1C',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 230, 180, 0.5), inset 0 -2px 4px rgba(0,0,0,0.2)',
          color: '#2A1D0B',
          textShadow: '0 1px 1px rgba(255,255,255,0.4)', // Engraved text effect
          fontSize: 40, // Slightly larger for emphasis
          borderRadius: '16px', // Matching the slightly squarer look in the screenshot
          cursor: 'pointer',
          transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        Start Session
      </button>
    </div>
  )
}
