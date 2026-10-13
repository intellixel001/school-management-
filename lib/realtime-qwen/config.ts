/**
 * @file lib/realtime-qwen/config.ts
 * @description Configuration for Qwen-Omni-Realtime via Alibaba DashScope.
 *
 * Mirrors the shape of lib/realtime/config.ts (OpenAI) so swapping providers is
 * a matter of swapping the imported config. Voice names, model names, and turn
 * detection thresholds differ between providers — set Qwen-specific values here.
 *
 * The browser does NOT use this directly to authenticate. It connects to the
 * local voice-proxy server which injects the QWEN_API_KEY on the way to
 * Alibaba. See server/voice-proxy.mjs.
 */

/** Qwen Realtime configuration (session.update payload values). */
export const QWEN_REALTIME_CONFIG = Object.freeze({
  /** Final-test fallback: ASR-only realtime model. Returns transcripts, no AI voice back. */
  model: 'qwen3-asr-flash-realtime',

  /** Qwen voice preset. Common options: Cherry, Ethan, Serena, Chelsie, Tina. */
  voice: 'Cherry' as const,

  /** Modalities the session emits. Qwen mirrors OpenAI here. */
  modalities: ['text', 'audio'] as const,

  /**
   * Server-side VAD config. Qwen supports the same shape as OpenAI:
   * threshold (0-1), prefix_padding_ms, silence_duration_ms.
   */
  turn_detection: Object.freeze({
    type: 'server_vad' as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 700,
  }),

  /**
   * Local WebSocket URL the browser connects to. The proxy at this URL forwards
   * to Alibaba's wss endpoint with the server-side API key injected as a Bearer
   * token. Override via NEXT_PUBLIC_VOICE_PROXY_URL if your proxy runs elsewhere.
   */
  proxyUrl:
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VOICE_PROXY_URL
      ? process.env.NEXT_PUBLIC_VOICE_PROXY_URL
      : 'ws://localhost:3001/qwen-realtime',

  /** Sample rate the API expects for input/output PCM16. */
  sampleRate: 16_000,
})

export type QwenRealtimeConfig = typeof QWEN_REALTIME_CONFIG
