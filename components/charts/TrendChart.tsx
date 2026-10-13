'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils/time'

// ── Chart geometry ────────────────────────────────────────────────────────────

const W       = 260
const H       = 140
const PAD     = { top: 18, right: 16, bottom: 14, left: 16 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom
const BOTTOM  = PAD.top + CHART_H

// ── Smooth bezier via catmull-rom ─────────────────────────────────────────────

function smoothPath(pts: {x: number; y: number}[], tension = 0.35): string {
  if (pts.length < 2) return `M ${pts[0].x},${pts[0].y}`
  const d: string[] = [`M ${pts[0].x},${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    d.push(`C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`)
  }
  return d.join(' ')
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrendDataPoint { score: number; date: string }

export interface TrendChartProps {
  title:        string
  currentScore: number
  accentColor:  string
  hexColor?:    string
  dataPoints:   TrendDataPoint[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TrendChart({
  title, currentScore, accentColor, hexColor = accentColor, dataPoints,
}: TrendChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; score: number; date: string
  } | null>(null)

  const raw    = dataPoints.length >= 2 ? dataPoints : padPoints(dataPoints, currentScore)
  const points = raw.map((p, i) => ({
    ...p,
    x: PAD.left + (raw.length === 1 ? CHART_W / 2 : (i / (raw.length - 1)) * CHART_W),
    y: PAD.top  + CHART_H - (p.score / 100) * CHART_H,
  }))

  const linePath = smoothPath(points)
  const areaPath = points.length >= 2
    ? `${linePath} L ${points[points.length - 1].x},${BOTTOM} L ${points[0].x},${BOTTOM} Z`
    : null

  const lastPt      = points[points.length - 1]
  const gradId      = `tg-${title.toLowerCase().replace(/[^a-z]/g, '')}`
  const scoreColor  = currentScore >= 75 ? '#10B981' : currentScore >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 12, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Title row ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: hexColor, boxShadow: `0 0 7px ${hexColor}`,
          }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            color: hexColor, textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>
            {title}
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 900,
          color: scoreColor,
          background: `${scoreColor}14`, border: `1px solid ${scoreColor}30`,
          borderRadius: 8, padding: '1px 9px', lineHeight: 1.6,
        }}>
          {currentScore}
        </span>
      </div>

      {/* ── SVG chart ──────────────────────────────────────────────────────── */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {/* Area gradient */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={hexColor} stopOpacity={0.45} />
            <stop offset="60%"  stopColor={hexColor} stopOpacity={0.08} />
            <stop offset="100%" stopColor={hexColor} stopOpacity={0.00} />
          </linearGradient>

          {/* Clip to chart bounds */}
          <clipPath id={`clip-${gradId}`}>
            <rect x={0} y={0} width={W} height={H} />
          </clipPath>

          {/* Subtle glow for the line */}
          <filter id={`gl-line-${gradId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Stronger glow for the last dot */}
          <filter id={`gl-dot-${gradId}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gridlines at 25 / 50 / 75 */}
        {([25, 50, 75] as const).map(val => {
          const gy  = PAD.top + CHART_H - (val / 100) * CHART_H
          const mid = val === 50
          return (
            <line key={val}
              x1={PAD.left} y1={gy} x2={W - PAD.right} y2={gy}
              stroke={mid ? 'rgba(0,0,0,0.09)' : 'rgba(0,0,0,0.04)'}
              strokeWidth={1}
              strokeDasharray={mid ? '3 3' : '2 5'}
            />
          )
        })}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#${gradId})`}
            clipPath={`url(#clip-${gradId})`}
          />
        )}

        {/* Smooth trend line */}
        {points.length >= 2 && (
          <path
            d={linePath}
            fill="none"
            stroke={hexColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            filter={`url(#gl-line-${gradId})`}
          />
        )}

        {/* Intermediate dots */}
        {points.slice(0, -1).map((p, i) => (
          <circle key={i}
            cx={p.x} cy={p.y} r={3.5}
            fill="white" stroke={hexColor} strokeWidth={1.5}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, score: p.score, date: p.date })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Last (current) dot — glowing */}
        {lastPt && (
          <g
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x: lastPt.x, y: lastPt.y, score: lastPt.score, date: lastPt.date })}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Outer glow rings */}
            <circle cx={lastPt.x} cy={lastPt.y} r={18} fill={hexColor} opacity={0.05} />
            <circle cx={lastPt.x} cy={lastPt.y} r={10} fill={hexColor} opacity={0.12} />
            {/* Core dot with glow filter */}
            <circle cx={lastPt.x} cy={lastPt.y} r={5}
              fill={hexColor}
              filter={`url(#gl-dot-${gradId})`}
            />
            {/* White centre */}
            <circle cx={lastPt.x} cy={lastPt.y} r={2} fill="#FFFFFF" />
          </g>
        )}

        {/* Tooltip */}
        {tooltip && (() => {
          const tw = 74, th = 34
          const tx = Math.min(W - tw - 4, Math.max(4, tooltip.x - tw / 2))
          const ty = tooltip.y > H / 2 ? tooltip.y - th - 8 : tooltip.y + 8
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th} rx={8}
                fill="#1E2D45" stroke={`${hexColor}55`} strokeWidth={1} />
              <text x={tx + tw / 2} y={ty + 13} textAnchor="middle"
                fill={hexColor} fontSize={12} fontFamily="monospace" fontWeight={800}>
                {tooltip.score}
              </text>
              <text x={tx + tw / 2} y={ty + 26} textAnchor="middle"
                fill="rgba(255,255,255,0.40)" fontSize={9} fontFamily="sans-serif">
                {formatDate(tooltip.date, 'short')}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Padding helper ────────────────────────────────────────────────────────────

function padPoints(existing: TrendDataPoint[], current: number): TrendDataPoint[] {
  return [
    { score: Math.max(0, current - 10), date: new Date(Date.now() - 4 * 7 * 86400000).toISOString() },
    { score: Math.max(0, current - 6),  date: new Date(Date.now() - 3 * 7 * 86400000).toISOString() },
    { score: Math.max(0, current - 3),  date: new Date(Date.now() - 2 * 7 * 86400000).toISOString() },
    { score: current,                    date: new Date().toISOString() },
    ...existing,
  ].slice(0, 5)
}
