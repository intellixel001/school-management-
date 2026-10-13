import type { SkillLevel } from '@/types/platform'

/** Order from easiest to hardest. Use for filters, sorts, and progression UI. */
export const LEVEL_ORDER: SkillLevel[] = ['entry-1', 'entry-2', 'entry-3', 'level-1']

/** Full human label. Use for headings, page titles, screen-reader text. */
export const LEVEL_LABEL: Record<SkillLevel, string> = {
  'entry-1': 'Entry Level 1',
  'entry-2': 'Entry Level 2',
  'entry-3': 'Entry Level 3',
  'level-1': 'Level 1',
}

/** Short badge form. Use for pills, table cells, navbar identity card. */
export const LEVEL_SHORT: Record<SkillLevel, string> = {
  'entry-1': 'E1',
  'entry-2': 'E2',
  'entry-3': 'E3',
  'level-1': 'L1',
}

/**
 * Difficulty score 1–4. Useful when prompts/components want a numeric handle
 * (e.g. "if difficulty >= 3 use longer passages"). Not the same as IELTS bands.
 */
export const LEVEL_DIFFICULTY: Record<SkillLevel, 1 | 2 | 3 | 4> = {
  'entry-1': 1,
  'entry-2': 2,
  'entry-3': 3,
  'level-1': 4,
}
