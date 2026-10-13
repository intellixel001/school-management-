'use client'

interface TranscriptPreviewProps {
  interimText: string
  isListening: boolean
}

export default function TranscriptPreview({ interimText, isListening }: TranscriptPreviewProps) {
  if (!isListening && !interimText) return null

  return (
    <div className="mx-auto max-w-lg min-h-[2.5rem] px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <p className="text-center text-sm text-violet-200 italic leading-relaxed">
        {interimText || (
          <span className="text-violet-400 animate-pulse">Listening for your voice…</span>
        )}
      </p>
    </div>
  )
}
