/**
 * @file lib/realtime/config.ts
 * @description Centralised, frozen configuration object for the OpenAI Realtime API
 * integration. All magic values for the Realtime pipeline live here — import this
 * object rather than hard-coding strings in routes or hooks.
 *
 * This file is intentionally isolated from the Groq-based pipeline; do NOT import
 * anything from the existing lib/ files here.
 */

import type { RealtimeConfig } from "@/types/realtime";

/**
 * Frozen config object for the OpenAI Realtime API session.
 * All Realtime-specific configuration is sourced from this single location.
 */
export const REALTIME_CONFIG: RealtimeConfig = Object.freeze({
  model: "gpt-4o-realtime-preview",
  voice: "echo",
  modalities: ["text", "audio"] as const,
  turn_detection: Object.freeze({
    type: "server_vad" as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 700,
  }),
});
