'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { MODES_CONFIG } from './modes.config'
import ModeInfoRow from './ModeInfoRow'

interface ModeInfoRowsProps {
  activeModeId: string | null
  setActiveModeId: (id: string | null) => void
  /**
   * `el` is the element the transition clones as its flying ghost. It must be
   * the row itself — never a page-level container.
   */
  onStartTransition: (modeId: string, accentColor: string, rect: DOMRect, el: HTMLElement | null) => void
}

const ModeInfoRows = forwardRef<HTMLDivElement, ModeInfoRowsProps>(({
  activeModeId,
  setActiveModeId,
  onStartTransition
}, ref) => {
  const [openId, setOpenId] = useState<string | null>(null)
  const internalRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => internalRef.current as HTMLDivElement)

  return (
    <div
      ref={internalRef}
      className="mode-info-rows-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: 574,
      }}
    >
      {MODES_CONFIG.map((config, index) => (
        <ModeInfoRow
          key={config.id}
          config={config}
          isOpen={openId === config.id}
          isActive={activeModeId === config.id}
          onToggle={() => {
            setOpenId(openId === config.id ? null : config.id)
          }}
          onPointerDown={() => setActiveModeId(config.id)}
          onPointerUp={() => setActiveModeId(null)}
          onStart={() => {
            const rowEl = internalRef.current?.children[index] as HTMLElement | undefined
            const rect = rowEl ? rowEl.getBoundingClientRect() : new DOMRect()
            onStartTransition(config.id, config.accent, rect, rowEl ?? null)
          }}
        />
      ))}
    </div>
  )
})

ModeInfoRows.displayName = 'ModeInfoRows'
export default ModeInfoRows
