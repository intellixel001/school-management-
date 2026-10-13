'use client'

import { Flame, GraduationCap, User } from 'lucide-react'
import type { LearnerProfile } from '@/types'

interface LearnerCardProps {
  profile: LearnerProfile
}

const levelColors: Record<string, string> = {
  A1: 'bg-slate-500/30 text-slate-300 border-slate-500/40',
  A2: 'bg-blue-500/30 text-blue-300 border-blue-500/40',
  B1: 'bg-green-500/30 text-green-300 border-green-500/40',
  B2: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/40',
  C1: 'bg-orange-500/30 text-orange-300 border-orange-500/40',
  C2: 'bg-pink-500/30 text-pink-300 border-pink-500/40',
}

export default function LearnerCard({ profile }: LearnerCardProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-violet-600/30 border-2 border-violet-500/50 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-violet-300" />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{profile.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelColors[profile.level]}`}
            >
              {profile.level}
            </span>
            <span className="text-[10px] text-violet-400 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              {profile.totalSessions} sessions
            </span>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <span className="text-xs text-orange-300 font-medium">
          {profile.streak}-day streak
        </span>
        <div className="ml-auto flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < profile.streak % 7 ? 'bg-orange-400' : 'bg-orange-900/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
