/**
 * Central frontend input length limits.
 *
 * Used by:
 * - Every text input / textarea via `maxLength` attribute
 * - Submit handlers that validate length before service calls
 * - `/api/evaluate-session` for defense-in-depth server-side enforcement
 *
 * Backend (Django) must enforce the same limits server-side — these are NOT
 * authoritative. They are the first line of defense against accidental misuse
 * and casual abuse.
 *
 * Numbers chosen to be GENEROUS for honest users and STRICT enough to prevent
 * runaway API costs or memory exhaustion.
 */
export const INPUT_LIMITS = {
  // ── Identity fields ─────────────────────────────────────────────────────
  EMAIL: 100,                    // RFC 5321 says 254; college emails are short
  NAME: 80,                      // Generous for full names with titles
  PIN: 6,                        // Exact (enforced by kiosk keypad + regex)
  OTP: 6,                        // Exact (enforced by regex)
  PASSWORD: 128,                 // Max password length

  // ── Practice / quiz inputs (cost-sensitive — sent to LLM) ──────────────
  PRACTICE_OPEN_ANSWER: 1000,    // ~200 words. More than any honest answer needs.
  WRITING_CANVAS: 3000,          // ~600 words. Essays at upper level.
  SPEAKING_TRANSCRIPT: 2000,     // Speech is rarely this long; high ceiling for ASR garble.
  QUIZ_ANSWER: 500,              // Quiz answers are short by design.

  // ── Teacher inputs ──────────────────────────────────────────────────────
  TEACHER_FEEDBACK: 2000,        // Free-form notes per student/session

  // ── Aggregate caps for batched payloads ────────────────────────────────
  // Total chars across all 5 answers in an evaluate-session request.
  EVALUATE_SESSION_TOTAL: 15_000, // 5 × 3000 (writing canvas max)
} as const

/**
 * Strips characters that have no legitimate use in identity fields:
 * - Control characters (\x00-\x1F, \x7F)
 * - Common XSS payload chars (< >)
 * - Excessive whitespace runs (collapsed to single space)
 * Returns a trimmed, cleaned string.
 *
 * Use for: name, email fields.
 * Do NOT use for: practice answers, writing canvas (which legitimately
 * contain punctuation, newlines, and may include < > symbols).
 */
export function sanitizeIdentityField(input: string, maxLength: number): string {
  // NOTE: does NOT trim — trimming on every keystroke breaks typing spaces
  // (typing "John " then "D" would produce "JohnD" because the trailing space
  // gets stripped before "D" arrives). Submit handlers call .trim() themselves.
  return input
    .replace(/[\x00-\x1F\x7F<>]/g, '')   // strip control chars + < >
    .replace(/\s+/g, ' ')                  // collapse whitespace runs
    .slice(0, maxLength)
}

/**
 * Truncates free-form text fields to the max length WITHOUT stripping content
 * characters. Preserves newlines (which sanitizeIdentityField would strip).
 * Use for practice answers, writing canvas, speaking transcripts, etc.
 */
export function clampLength(input: string, maxLength: number): string {
  return input.slice(0, maxLength)
}

// RFC 5322 simplified — covers all realistic email shapes, rejects junk.
// Kept intentionally permissive on the local part; strict on the domain shape.
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}
