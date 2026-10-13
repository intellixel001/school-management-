'use client'

import { BookOpen } from 'lucide-react'
interface VocabWord {
  word: string
  type: 'Advanced' | 'Academic' | 'Phrasal' | 'Idiom'
}

interface VocabListProps {
  words: VocabWord[]
}

const typeColors: Record<VocabWord['type'], string> = {
  Advanced: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Academic: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Phrasal: 'bg-green-500/20 text-green-300 border-green-500/30',
  Idiom: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export default function VocabList({ words }: VocabListProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5" />
        Vocabulary ({words.length})
      </h3>

      {words.length === 0 ? (
        <p className="text-[11px] text-violet-600 italic">Words from your session will appear here…</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
          {words.map((w, i) => (
            <div
              key={i}
              className="rounded-xl bg-violet-900/20 border border-violet-700/30 px-3 py-2 flex items-center justify-between gap-2"
            >
              <p className="text-xs font-semibold text-violet-200 truncate">{w.word}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${typeColors[w.type]}`}>
                {w.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
