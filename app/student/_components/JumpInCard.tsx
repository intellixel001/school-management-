'use client'

import Link from 'next/link'
import { Zap, Trophy, ArrowRight } from 'lucide-react'

interface Action {
  href: string
  label: string
  desc: string
  Icon: typeof Zap
  color: string
}

const ACTIONS: Action[] = [
  { href: '/student/quiz',     label: 'Quick Quiz', desc: '5 rapid-fire questions', Icon: Zap,    color: '#8B5CF6' },
  { href: '/student/results',  label: 'My Results', desc: 'View past performance',  Icon: Trophy, color: '#10B981' },
]

export function JumpInCard() {
  return (
    <div className="jump-in-card" style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: '22px 22px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(99,102,241,0.10)',
      transition: 'box-shadow 200ms ease, transform 200ms ease',
    }}>
      <h2 style={{
        margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: '#0F172A',
        fontFamily: 'var(--font-display)',
      }}>
        Jump In
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ACTIONS.map(a => {
          const { Icon } = a
          return (
            <Link key={a.href} href={a.href} className="jump-in-row" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 14px', borderRadius: 12,
              background: `${a.color}0F`,
              border: `1px solid ${a.color}24`,
              textDecoration: 'none',
              transition: 'transform 140ms ease, background 140ms ease',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: `${a.color}1F`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={a.color} strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  {a.desc}
                </div>
              </div>
              <ArrowRight size={15} color="#CBD5E1" className="jump-in-arrow" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
