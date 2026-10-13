'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, Download, ExternalLink, ChevronDown } from 'lucide-react'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { formatDate, getRelativeTime } from '@/lib/utils/time'
import type { ReviewHistoryItem, ReviewSource } from '@/lib/services'
import type { SkillArea } from '@/types/platform'

// ── Skill colour map ──────────────────────────────────────────────────────────

const SKILL_COLORS: Record<SkillArea, string> = {
  reading:   '#6366F1',
  writing:   '#059669',
  speaking:  '#D97706',
  listening: '#3B82F6',
}

const SOURCE_COLORS: Record<ReviewSource, string> = {
  practice: '#6366F1',
  mock:     '#0066CC',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SourceFilter = 'all' | ReviewSource
type SkillFilter  = 'all' | SkillArea
type DateFilter   = 'all' | '7d' | '30d'
type SortKey      = 'date-desc' | 'date-asc' | 'student-asc' | 'skill'

interface FeedbackTableProps {
  items: ReviewHistoryItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function truncate(text: string, max = 110) {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

function exportCSV(rows: ReviewHistoryItem[]) {
  const header = ['Student Name', 'Student ID', 'Source', 'Skill Area', 'Mock Title', 'Reviewed Date', 'Feedback Text']
  const lines  = rows.map(r => [
    `"${r.studentName}"`,
    `"${r.studentId}"`,
    `"${r.source}"`,
    `"${r.skillArea}"`,
    `"${r.mockTitle ?? ''}"`,
    `"${r.reviewedAt}"`,
    `"${r.feedbackText.replace(/"/g, '""')}"`,
  ].join(','))
  const csv  = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `review-history-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Pill config ───────────────────────────────────────────────────────────────

const SOURCE_PILLS: Array<{ value: SourceFilter; label: string; activeColor: string; activeBg: string }> = [
  { value: 'all',      label: 'All Sources', activeColor: '#4D9FFF', activeBg: 'rgba(77,159,255,0.10)'   },
  { value: 'practice', label: 'Practice',    activeColor: '#6366F1', activeBg: 'rgba(99,102,241,0.08)'  },
  { value: 'mock',     label: 'Mock',        activeColor: '#0066CC', activeBg: 'rgba(0,102,204,0.08)'   },
]

const SKILL_PILLS: Array<{ value: SkillFilter; label: string }> = [
  { value: 'all',       label: 'All Skills' },
  { value: 'reading',   label: 'Reading'    },
  { value: 'writing',   label: 'Writing'    },
  { value: 'speaking',  label: 'Speaking'   },
  { value: 'listening', label: 'Listening'  },
]

const DATE_PILLS: Array<{ value: DateFilter; label: string }> = [
  { value: 'all', label: 'All time'     },
  { value: '7d',  label: 'Last 7 days'  },
  { value: '30d', label: 'Last 30 days' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function FeedbackTable({ items }: FeedbackTableProps) {
  const [search,       setSearch]    = useState('')
  const [skillFilter,  setSkill]     = useState<SkillFilter>('all')
  const [sourceFilter, setSource]    = useState<SourceFilter>('all')
  const [dateFilter,   setDate]      = useState<DateFilter>('all')
  const [sortKey,      setSort]      = useState<SortKey>('date-desc')
  const [selected,     setSelected]  = useState<Set<string>>(new Set())
  const [viewing,      setViewing]   = useState<ReviewHistoryItem | null>(null)
  const [hoveredId,    setHoveredId] = useState<string | null>(null)

  // ── Filter + sort ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const now   = Date.now()
    const ms7d  = 7  * 86_400_000
    const ms30d = 30 * 86_400_000

    return items
      .filter(item => {
        if (search) {
          const q = search.toLowerCase()
          if (!item.studentName.toLowerCase().includes(q) && !item.studentId.toLowerCase().includes(q)) return false
        }
        if (skillFilter  !== 'all' && item.skillArea !== skillFilter)  return false
        if (sourceFilter !== 'all' && item.source    !== sourceFilter) return false
        if (dateFilter !== 'all') {
          const age = now - new Date(item.reviewedAt).getTime()
          if (dateFilter === '7d'  && age > ms7d)  return false
          if (dateFilter === '30d' && age > ms30d) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortKey === 'date-desc')   return new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
        if (sortKey === 'date-asc')    return new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime()
        if (sortKey === 'student-asc') return a.studentName.localeCompare(b.studentName)
        if (sortKey === 'skill')       return a.skillArea.localeCompare(b.skillArea)
        return 0
      })
  }, [items, search, skillFilter, sourceFilter, dateFilter, sortKey])

  // ── Selection helpers ───────────────────────────────────────────────────────

  const allSelected   = filtered.length > 0 && filtered.every(i => selected.has(i.id))
  const someSelected  = selected.size > 0
  const selectedItems = items.filter(i => selected.has(i.id))

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map(i => i.id)))
  }

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
        marginBottom: 14,
      }}>

        {/* Row 1: search + sort + export */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={14} style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search by name or student ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 32px 8px 33px',
                background: 'var(--bg-surface-2)',
                border: '1.5px solid var(--border-default)',
                borderRadius: 10,
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--text-primary)', outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#4D9FFF'
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(77,159,255,0.12)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.boxShadow   = 'none'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  color: 'var(--text-muted)', display: 'flex',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div style={{ position: 'relative' }}>
            <select
              value={sortKey}
              onChange={e => setSort(e.target.value as SortKey)}
              style={{
                appearance: 'none', padding: '8px 30px 8px 12px',
                background: 'var(--bg-surface-2)', border: '1.5px solid var(--border-default)',
                borderRadius: 10, fontFamily: 'var(--font-body)',
                fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#4D9FFF' }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="student-asc">Student A–Z</option>
              <option value="skill">Skill area</option>
            </select>
            <ChevronDown size={12} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
          </div>

          {/* Export all */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => exportCSV(items)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: 'var(--bg-surface-2)',
                border: '1.5px solid var(--border-default)',
                borderRadius: 10,
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
                whiteSpace: 'nowrap',
                transition: 'border-color 150ms ease, color 150ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#4D9FFF'
                e.currentTarget.style.color = '#4D9FFF'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <Download size={13} />
              Export All
            </button>
          )}
        </div>

        {/* Row 2: filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Source */}
          {SOURCE_PILLS.map(p => {
            const active = sourceFilter === p.value
            return (
              <button key={p.value} type="button" onClick={() => setSource(p.value)} style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1.5px solid ${active ? p.activeColor + '60' : 'var(--border-default)'}`,
                background: active ? p.activeBg : 'transparent',
                color: active ? p.activeColor : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
              }}>
                {p.label}
              </button>
            )
          })}

          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />

          {/* Skill */}
          {SKILL_PILLS.map(p => {
            const active = skillFilter === p.value
            const color  = p.value === 'all' ? '#4D9FFF' : SKILL_COLORS[p.value as SkillArea]
            return (
              <button key={p.value} type="button" onClick={() => setSkill(p.value)} style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1.5px solid ${active ? color + '60' : 'var(--border-default)'}`,
                background: active ? color + '12' : 'transparent',
                color: active ? color : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
              }}>
                {p.label}
              </button>
            )
          })}

          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />

          {/* Date */}
          {DATE_PILLS.map(p => {
            const active = dateFilter === p.value
            return (
              <button key={p.value} type="button" onClick={() => setDate(p.value)} style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1.5px solid ${active ? 'rgba(77,159,255,0.60)' : 'var(--border-default)'}`,
                background: active ? 'rgba(77,159,255,0.10)' : 'transparent',
                color: active ? '#4D9FFF' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
              }}>
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
      {someSelected && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', marginBottom: 10,
          background: 'linear-gradient(135deg, #0A1628 0%, #0E2444 100%)',
          border: '1px solid rgba(77,159,255,0.22)',
          borderRadius: 10,
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#4D9FFF', fontWeight: 700 }}>
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => exportCSV(selectedItems)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px',
              background: 'linear-gradient(135deg, #4D9FFF 0%, #0066CC 100%)',
              color: '#FFFFFF', border: 'none', borderRadius: 8,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', outline: 'none',
              boxShadow: '0 3px 10px rgba(0,102,204,0.30)',
            }}
          >
            <Download size={13} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: '#64748B', padding: 2, display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Results count ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          {filtered.length !== items.length && ` of ${items.length}`}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '60px 20px', textAlign: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(77,159,255,0.08)',
            border: '1px solid rgba(77,159,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Search size={22} style={{ color: '#4D9FFF', opacity: 0.6 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
            No reviews match the current filters.
          </span>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 200px 110px 120px 110px 1fr 140px',
            padding: '10px 16px',
            background: 'var(--bg-surface-2)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                style={{ cursor: 'pointer', accentColor: '#4D9FFF', width: 14, height: 14 }}
              />
            </div>
            {(['Student', 'Skill', 'Reviewed', 'Source', 'Preview', 'Actions'] as const).map(col => (
              <span key={col} style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center',
              }}>
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((item, idx) => {
              const skillColor  = SKILL_COLORS[item.skillArea]
              const sourceColor = SOURCE_COLORS[item.source]
              const cfg         = SKILL_CONFIG[item.skillArea]
              const isLast      = idx === filtered.length - 1
              const checked     = selected.has(item.id)
              const hovered     = hoveredId === item.id
              const highlight   = hovered || checked

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 200px 110px 120px 110px 1fr 140px',
                    paddingTop: 13, paddingBottom: 13,
                    paddingLeft: highlight ? 13 : 16, paddingRight: 16,
                    borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                    borderLeft: `3px solid ${highlight ? skillColor : 'transparent'}`,
                    background: checked
                      ? `${skillColor}08`
                      : hovered ? 'var(--bg-surface-2)' : 'transparent',
                    alignItems: 'center',
                    transition: 'background 120ms ease, border-color 120ms ease, padding 120ms ease',
                  }}
                >
                  {/* Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRow(item.id)}
                      style={{ cursor: 'pointer', accentColor: '#4D9FFF', width: 14, height: 14 }}
                    />
                  </div>

                  {/* Student */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${skillColor}90 0%, ${skillColor}50 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#FFF', letterSpacing: '-0.3px',
                      boxShadow: hovered ? `0 0 10px ${skillColor}35` : 'none',
                      transition: 'box-shadow 150ms ease',
                    }}>
                      {avatarInitials(item.studentName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Link
                        href={`/teacher/students/${item.studentId}`}
                        style={{
                          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                          color: 'var(--text-primary)', textDecoration: 'none',
                          display: 'block',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {item.studentName}
                      </Link>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                        {item.studentId}
                      </span>
                    </div>
                  </div>

                  {/* Skill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: `${skillColor}18`,
                      border: `1px solid ${skillColor}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: hovered ? `0 0 8px ${skillColor}22` : 'none',
                      transition: 'box-shadow 150ms ease',
                    }}>
                      <cfg.icon size={12} color={skillColor} strokeWidth={2.2} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                      color: skillColor, textTransform: 'capitalize',
                    }}>
                      {item.skillArea}
                    </span>
                  </div>

                  {/* Reviewed date */}
                  <span
                    title={formatDate(item.reviewedAt, 'long')}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}
                  >
                    {getRelativeTime(item.reviewedAt)}
                  </span>

                  {/* Source */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 20, width: 'fit-content',
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                    background: `${sourceColor}12`,
                    color: sourceColor,
                    textTransform: 'capitalize',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sourceColor }} />
                    {item.source}
                    {item.source === 'mock' && item.mockTitle ? ` · ${item.mockTitle}` : ''}
                  </span>

                  {/* Preview */}
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 12,
                    color: 'var(--text-muted)', lineHeight: 1.4,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    paddingRight: 12,
                  }}>
                    {truncate(item.feedbackText)}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setViewing(item)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px',
                        background: hovered ? `${skillColor}12` : 'var(--bg-surface-2)',
                        border: `1px solid ${hovered ? skillColor + '35' : 'var(--border-default)'}`,
                        borderRadius: 6, cursor: 'pointer', outline: 'none',
                        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                        color: hovered ? skillColor : 'var(--text-secondary)',
                        transition: 'all 150ms ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View Full
                    </button>
                    <Link
                      href={item.detailHref}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px',
                        background: 'rgba(77,159,255,0.07)',
                        border: '1px solid rgba(77,159,255,0.20)',
                        borderRadius: 6,
                        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                        color: '#4D9FFF', textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ExternalLink size={10} />
                      View
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── View Full modal ─────────────────────────────────────────────────── */}
      {viewing && (() => {
        const skillColor  = SKILL_COLORS[viewing.skillArea]
        const sourceColor = SOURCE_COLORS[viewing.source]
        const SkillIcon   = SKILL_CONFIG[viewing.skillArea].icon
        return (
          <>
            {/* Backdrop */}
            <div
              aria-hidden="true"
              onClick={() => setViewing(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(2px)',
                zIndex: 300,
              }}
            />

            {/* Modal */}
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%', maxWidth: 580,
                borderRadius: 16,
                boxShadow: '0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
                zIndex: 301,
                overflow: 'hidden',
                animation: 'fadeSlideUp 200ms ease-out both',
              }}
            >
              {/* Dark header */}
              <div style={{
                background: 'linear-gradient(135deg, #0A1628 0%, #0E2444 100%)',
                padding: '20px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `2px solid ${skillColor}38`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                    background: `${skillColor}20`,
                    border: `1px solid ${skillColor}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 14px ${skillColor}22`,
                  }}>
                    <SkillIcon size={18} style={{ color: skillColor }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>
                      {viewing.studentName}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      <span style={{ color: skillColor, fontWeight: 600 }}>
                        {SKILL_CONFIG[viewing.skillArea].label}
                      </span>
                      {' '}· {viewing.studentId} · {formatDate(viewing.reviewedAt, 'short')}
                      {viewing.source === 'mock' && viewing.mockTitle && (
                        <span style={{ color: sourceColor }}> · {viewing.mockTitle}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', color: '#64748B',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div style={{ background: 'var(--bg-surface)', padding: '20px 24px' }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 20,
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                    background: `${sourceColor}12`,
                    color: sourceColor,
                    textTransform: 'capitalize',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sourceColor }} />
                    {viewing.source} feedback
                  </span>
                </div>

                <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Teacher Feedback
                </div>
                <div style={{
                  background: 'var(--bg-surface-2)',
                  borderRadius: 10,
                  borderLeft: `3px solid ${skillColor}`,
                  padding: '14px 16px',
                  fontFamily: 'var(--font-body)', fontSize: 13.5,
                  color: 'var(--text-secondary)', lineHeight: 1.7,
                }}>
                  {viewing.feedbackText}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
                padding: '14px 24px',
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <Link
                  href={viewing.detailHref}
                  onClick={() => setViewing(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, #4D9FFF 0%, #0066CC 100%)',
                    color: '#FFFFFF', borderRadius: 9,
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0,102,204,0.28)',
                  }}
                >
                  <ExternalLink size={13} />
                  Open Details
                </Link>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 9, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )
      })()}
    </>
  )
}
