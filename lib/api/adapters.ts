/**
 * @file lib/api/adapters.ts
 * @description Shape adapters for backend responses whose format doesn't
 * quite match our frontend types.
 *
 * These are intentionally small and pure — no I/O, no dependencies on the
 * client. Call them at the boundary of each service function that hits the
 * real backend, so the UI sees the exact shape it was written against.
 */

/**
 * Backend returns MCQ options as `{ A: "text", B: "text", ... }` for both
 * `/api/questions` and `/api/practice-pool`. Our UI (kiosk reading/listening,
 * ChatTranscript) treats options as `string[]` matching the dummy convention
 * `["A text", "B text", ...]` — the letter is part of the option text so
 * students see labelled choices without extra rendering.
 *
 * This adapter converts the object shape into that array format, preserving
 * key order. If `options` is already an array (dummy path) or missing, it's
 * returned untouched.
 */
export function normalizeOptions<T extends { options?: unknown }>(item: T): T {
  const opts = item.options
  if (
    opts &&
    typeof opts === 'object' &&
    !Array.isArray(opts) &&
    Object.keys(opts as Record<string, unknown>).length > 0
  ) {
    const asArr = Object.entries(opts as Record<string, string>).map(
      ([letter, text]) => `${letter} ${text}`
    )
    return { ...item, options: asArr }
  }
  return item
}

/**
 * Convenience: walk a passage's `questions` array and normalise each
 * question's options field. Non-mutating; returns a new object.
 */
export function normalizePassageQuestions<
  Q extends { options?: unknown },
  P extends { questions?: Q[] }
>(passage: P): P {
  if (!Array.isArray(passage.questions)) return passage
  return { ...passage, questions: passage.questions.map(normalizeOptions) }
}
