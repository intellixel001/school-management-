/**
 * Returns a human-readable relative time string.
 * e.g. "Just now", "2 hours ago", "Yesterday", "3 days ago", "2 weeks ago"
 * Input: ISO 8601 date string
 */
export function getRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return "Just now"

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return "Yesterday"
  if (diffDay <= 14) return `${diffDay} days ago`

  const diffWeek = Math.floor(diffDay / 7)
  if (diffDay <= 30) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`

  return formatDate(isoString, "short")
}

/**
 * Returns a formatted date string.
 * e.g. "Mon 13 Jan" or "Wednesday, 13 May 2026" depending on format param
 */
export function formatDate(isoString: string, format: "short" | "long"): string {
  const date = new Date(isoString)
  if (format === "short") {
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date)
    const day = date.getDate()
    const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date)
    return `${weekday} ${day} ${month}`
  } else {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }
}

/**
 * Returns greeting string based on current hour.
 * "Good morning" (5–11), "Good afternoon" (12–17), "Good evening" (18–4)
 */
export function getGreeting(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: 'numeric',
    hour12: false
  })
  const hour = parseInt(formatter.format(new Date()), 10)
  if (hour >= 5 && hour <= 11) return "Good morning"
  if (hour >= 12 && hour <= 17) return "Good afternoon"
  return "Good evening"
}
