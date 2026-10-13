'use client'

import { Clock, TrendingUp } from 'lucide-react'
import type { SessionStats } from '@/types'

interface MetricCardProps {
  stats: SessionStats
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MetricCard({ stats }: MetricCardProps) {
  const scoreColor =
    stats.score >= 80
      ? 'text-green-400'
      : stats.score >= 60
      ? 'text-yellow-400'
      : 'text-red-400'

  const scoreBg =
    stats.score >= 80
      ? 'bg-green-500'
      : stats.score >= 60
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">
        Session Stats
      </h3>

      {/* Confidence */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Confidence
          </span>
          <span className={`text-sm font-bold ${scoreColor}`}>
            {stats.score > 0 ? `${stats.score}%` : '—'}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBg}`}
            style={{ width: `${stats.score}%` }}
          />
        </div>
      </div>

      {/* Duration + Exchanges */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center">
          <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1 mb-1">
            <Clock className="w-2.5 h-2.5" /> Duration
          </p>
          <p className="text-base font-bold text-white">{formatDuration(stats.duration)}</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Exchanges</p>
          <p className="text-base font-bold text-violet-300">{stats.exchanges}</p>
        </div>
      </div>
    </div>
  )
}
