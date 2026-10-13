/**
 * IELTS band conversion utilities.
 * Source: Cambridge IELTS official band conversion tables.
 *
 * Reading + Listening: raw correct count → IELTS band (0-9, .5 increments).
 * Writing: 4 sub-bands averaged → overall band rounded to nearest .5.
 */

/**
 * IELTS Reading band conversion for academic test (out of 40, scaled for our /13).
 * Karani uses /13 questions per mock; this table maps that range.
 *
 * Our scaling:
 *   13/13 = 9.0
 *   12/13 = 8.5
 *   11/13 = 8.0
 *   10/13 = 7.0
 *   9/13  = 6.5
 *   8/13  = 6.0
 *   7/13  = 5.5
 *   6/13  = 5.0
 *   5/13  = 4.5
 *   4/13  = 4.0
 *   3/13  = 3.5
 *   2/13  = 3.0
 *   1/13  = 2.0
 *   0/13  = 0.0
 */
const READING_13_TO_BAND: Readonly<Record<number, number>> = {
  13: 9.0, 12: 8.5, 11: 8.0, 10: 7.0, 9: 6.5,
  8: 6.0, 7: 5.5, 6: 5.0, 5: 4.5, 4: 4.0,
  3: 3.5, 2: 3.0, 1: 2.0, 0: 0.0,
}

/**
 * IELTS Listening band conversion (out of 40, scaled for our /20).
 *
 *   20/20 = 9.0
 *   19/20 = 8.5
 *   18/20 = 8.0
 *   17/20 = 7.5
 *   15-16/20 = 7.0
 *   13-14/20 = 6.5
 *   11-12/20 = 6.0
 *   10/20 = 5.5
 *   8-9/20 = 5.0
 *   6-7/20 = 4.5
 *   5/20 = 4.0
 *   4/20 = 3.5
 *   3/20 = 3.0
 *   2/20 = 2.5
 *   1/20 = 2.0
 *   0/20 = 0.0
 */
const LISTENING_20_TO_BAND: Readonly<Record<number, number>> = {
  20: 9.0, 19: 8.5, 18: 8.0, 17: 7.5,
  16: 7.0, 15: 7.0,
  14: 6.5, 13: 6.5,
  12: 6.0, 11: 6.0,
  10: 5.5,
  9: 5.0, 8: 5.0,
  7: 4.5, 6: 4.5,
  5: 4.0,
  4: 3.5,
  3: 3.0,
  2: 2.5,
  1: 2.0,
  0: 0.0,
}

export function readingRawToBand(rawScore: number, total: number = 13): number {
  if (total === 13) return READING_13_TO_BAND[rawScore] ?? 0
  // If a future mock uses a different question count, scale linearly to /13 first
  const scaledTo13 = Math.round((rawScore / total) * 13)
  return READING_13_TO_BAND[scaledTo13] ?? 0
}

export function listeningRawToBand(rawScore: number, total: number = 20): number {
  if (total === 20) return LISTENING_20_TO_BAND[rawScore] ?? 0
  const scaledTo20 = Math.round((rawScore / total) * 20)
  return LISTENING_20_TO_BAND[scaledTo20] ?? 0
}

/**
 * Average the 4 writing sub-bands, round to nearest .5 (IELTS convention).
 * Example: avg of 6, 6.5, 6, 7 = 6.375 → rounds to 6.5.
 */
export function writingBandsToOverall(bands: {
  taskResponse: number
  coherenceCohesion: number
  lexicalResource: number
  grammaticalRange: number
}): number {
  const avg = (bands.taskResponse + bands.coherenceCohesion + bands.lexicalResource + bands.grammaticalRange) / 4
  return Math.round(avg * 2) / 2     // round to nearest .5
}

/**
 * Average of 3 section bands (Reading + Listening + Writing) into an overall
 * mock band. Used when all 3 sections done.
 */
export function overallMockBand(bands: {
  reading: number | null
  listening: number | null
  writing: number | null
}): number | null {
  const values = [bands.reading, bands.listening, bands.writing].filter((b): b is number => b !== null)
  if (values.length === 0) return null
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.round(avg * 2) / 2
}
