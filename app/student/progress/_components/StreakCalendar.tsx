// StreakCalendar — last 28 days, intensity based on session count that day

import type { Session } from '@/types/platform'

interface Props { sessions: Session[] }

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const CELL  = 28
const GAP   = 5

export function StreakCalendar({ sessions }: Props) {
  // Count sessions per date
  const countByDate = new Map<string, number>()
  sessions.forEach(s => {
    const d = s.date.slice(0, 10)
    countByDate.set(d, (countByDate.get(d) ?? 0) + 1)
  })

  const today     = new Date()
  const todayStr  = today.toISOString().slice(0, 10)

  // Start from the Monday 27 days ago
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 27)
  const dow = startDate.getDay()
  startDate.setDate(startDate.getDate() + (dow === 0 ? -6 : 1 - dow))

  const days: Array<{ dateStr: string; isToday: boolean; count: number }> = []
  for (let i = 0; i < 28; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    days.push({ dateStr, isToday: dateStr === todayStr, count: countByDate.get(dateStr) ?? 0 })
  }

  const activeDays = days.filter(d => d.count > 0).length

  function cellColor(count: number) {
    if (count === 0) return '#EEF2FF'
    if (count === 1) return '#818CF8'
    return '#4F46E5'
  }
  function cellGlow(count: number) {
    if (count >= 2) return '0 0 6px rgba(79,70,229,0.45)'
    if (count === 1) return '0 0 4px rgba(99,102,241,0.25)'
    return 'none'
  }

  return (
    <div>
      {/* Summary line */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { color: '#EEF2FF', label: 'No session' },
            { color: '#818CF8', label: '1 session' },
            { color: '#4F46E5', label: '2+' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ fontSize: 10, color: '#94A3B8' }}>{l.label}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1' }}>
          {activeDays} active days
        </span>
      </div>

      {/* Day column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(7, ${CELL}px)`, gap: GAP, marginBottom: 4,
      }}>
        {DAY_LABELS.map((l, i) => (
          <div key={i} style={{
            width: CELL, textAlign: 'center',
            fontSize: 10, fontWeight: 700, color: '#CBD5E1',
          }}>
            {l}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELL}px)`, gap: GAP }}>
        {days.map(day => (
          <div
            key={day.dateStr}
            title={`${day.dateStr}${day.count > 0 ? ` — ${day.count} session${day.count > 1 ? 's' : ''}` : ''}`}
            style={{
              width: CELL, height: CELL, borderRadius: 7,
              background: cellColor(day.count),
              boxShadow: cellGlow(day.count),
              outline: day.isToday ? '2px solid #6366F1' : 'none',
              outlineOffset: 2,
              transition: 'background 300ms ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
