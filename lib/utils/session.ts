/**
 * Formats elapsed seconds into "MM:SS" format for the session timer.
 * e.g. 754 → "12:34"
 */
export function formatSessionTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Formats elapsed seconds into a human-readable string.
 * e.g. 754 → "12m 34s"
 */
export function formatSessionDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

/**
 * Derives a session score from available data.
 * Priority: confidence score if available, else exchangeCount-based fallback.
 */
export function deriveSessionScore(
  confidence: number | null,
  exchangeCount: number
): number {
  if (confidence !== null && confidence > 0) return Math.round(confidence)
  return Math.min(100, exchangeCount * 10)
}
