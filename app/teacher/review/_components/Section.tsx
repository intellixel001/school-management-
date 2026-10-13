'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface SectionProps {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function Section({ title, children, collapsible, defaultCollapsed }: SectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 12,
      marginBottom: 24,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
    }}>
      <div 
        onClick={() => collapsible && setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: '#FAFAFA',
          borderBottom: collapsed ? 'none' : '1px solid rgba(15, 23, 42, 0.06)',
          cursor: collapsible ? 'pointer' : 'default',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
          {title}
        </h3>
        {collapsible && (
          <span style={{ color: '#6B7280' }}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </span>
        )}
      </div>
      {!collapsed && (
        <div style={{ padding: 20 }}>
          {children}
        </div>
      )}
    </div>
  )
}
