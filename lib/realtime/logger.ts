/**
 * @file lib/realtime/logger.ts
 * @description Conditional debug logger for the Realtime pipeline.
 *
 * Logs are emitted ONLY in `development` mode so that production builds
 * produce zero [Realtime] console output. Wrap every debug statement in
 * this utility instead of calling console.log directly.
 *
 * Usage:
 *   import { realtimeLog } from '@/lib/realtime/logger'
 *   realtimeLog('connect', 'Fetching ephemeral token...')
 *   realtimeLog('events', 'Event received:', event)
 */

const IS_DEV = process.env.NODE_ENV === 'development'

/**
 * Logs a prefixed debug message to the console in development mode only.
 * In production the function body is skipped entirely — no dead-code stripping
 * required; the `IS_DEV` guard is evaluated at module load and the branch is
 * never entered on production builds.
 *
 * @param label - Short context label (e.g. 'connect', 'events', 'session')
 * @param args  - Arbitrary values forwarded to console.log
 */
export function realtimeLog(label: string, ...args: unknown[]): void {
  if (!IS_DEV) return
   
  console.log(`[Realtime:${label}]`, ...args)
}

/**
 * Logs a prefixed warning in development mode only.
 */
export function realtimeWarn(label: string, ...args: unknown[]): void {
  if (!IS_DEV) return
   
  console.warn(`[Realtime:${label}]`, ...args)
}

/**
 * Always logs errors regardless of environment — errors should be visible
 * in production for debugging support. The [Realtime] prefix is kept for
 * filtering in log aggregators.
 */
export function realtimeError(label: string, ...args: unknown[]): void {
   
  console.error(`[Realtime:${label}]`, ...args)
}
