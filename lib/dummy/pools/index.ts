/**
 * Practice & Mock Pool Barrel Export
 *
 * ID conventions:
 *   Practice: {skill-prefix}-{level-abbrev}-{3-digit-seq}
 *     skill-prefix: r (reading), w (writing), s (speaking), l (listening)
 *     level-abbrev: e1, e2, e3, l1
 *     Example: r-e1-001, w-l1-003
 *
 *   Mocks: mock-{level-abbrev}-{1-5}
 *     Example: mock-e1-1, mock-l1-3
 */

import type {
  SkillLevel,
  ReadingPassage,
  WritingPrompt,
  SpeakingTopic,
  ListeningPassage,
} from '@/types/platform'

// ─── Practice pool imports ──────────────────────────────────────────────────

import { ENTRY_1_READING }   from './practice/entry-1/reading'
import { ENTRY_1_WRITING }   from './practice/entry-1/writing'
import { ENTRY_1_SPEAKING }  from './practice/entry-1/speaking'
import { ENTRY_1_LISTENING } from './practice/entry-1/listening'

import { ENTRY_2_READING }   from './practice/entry-2/reading'
import { ENTRY_2_WRITING }   from './practice/entry-2/writing'
import { ENTRY_2_SPEAKING }  from './practice/entry-2/speaking'
import { ENTRY_2_LISTENING } from './practice/entry-2/listening'

import { ENTRY_3_READING }   from './practice/entry-3/reading'
import { ENTRY_3_WRITING }   from './practice/entry-3/writing'
import { ENTRY_3_SPEAKING }  from './practice/entry-3/speaking'
import { ENTRY_3_LISTENING } from './practice/entry-3/listening'

import { LEVEL_1_READING }   from './practice/level-1/reading'
import { LEVEL_1_WRITING }   from './practice/level-1/writing'
import { LEVEL_1_SPEAKING }  from './practice/level-1/speaking'
import { LEVEL_1_LISTENING } from './practice/level-1/listening'

// ─── Mock paper imports removed in Mock-phase-6 cleanup ─────────

// ─── Practice pool shape ────────────────────────────────────────────────────

export interface PracticePool {
  reading:   ReadingPassage[]
  writing:   WritingPrompt[]
  speaking:  SpeakingTopic[]
  listening: ListeningPassage[]
}

/**
 * Stratified practice pools — random-pull source for practice mode.
 * `PRACTICE_POOLS['entry-1'].reading` → typed `ReadingPassage[]`
 */
export const PRACTICE_POOLS: Record<SkillLevel, PracticePool> = {
  'entry-1': {
    reading:   ENTRY_1_READING,
    writing:   ENTRY_1_WRITING,
    speaking:  ENTRY_1_SPEAKING,
    listening: ENTRY_1_LISTENING,
  },
  'entry-2': {
    reading:   ENTRY_2_READING,
    writing:   ENTRY_2_WRITING,
    speaking:  ENTRY_2_SPEAKING,
    listening: ENTRY_2_LISTENING,
  },
  'entry-3': {
    reading:   ENTRY_3_READING,
    writing:   ENTRY_3_WRITING,
    speaking:  ENTRY_3_SPEAKING,
    listening: ENTRY_3_LISTENING,
  },
  'level-1': {
    reading:   LEVEL_1_READING,
    writing:   LEVEL_1_WRITING,
    speaking:  LEVEL_1_SPEAKING,
    listening: LEVEL_1_LISTENING,
  },
}

// ─── MOCK_PAPERS removed in Mock-phase-6 cleanup ──────────────

// ─── Typed accessor helpers for Phase 4 services ────────────────────────────

export function getPracticeReading(level: SkillLevel): ReadingPassage[] {
  return PRACTICE_POOLS[level].reading
}

export function getPracticeWriting(level: SkillLevel): WritingPrompt[] {
  return PRACTICE_POOLS[level].writing
}

export function getPracticeSpeaking(level: SkillLevel): SpeakingTopic[] {
  return PRACTICE_POOLS[level].speaking
}

export function getPracticeListening(level: SkillLevel): ListeningPassage[] {
  return PRACTICE_POOLS[level].listening
}


