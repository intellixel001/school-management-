/**
 * @file types/realtime.ts
 * @description Comprehensive TypeScript type definitions for the OpenAI Realtime API
 * integration. These types are strictly isolated from the existing Groq pipeline types
 * in types/index.ts — do NOT mix or cross-import between the two type files.
 *
 * Covers: configuration, session lifecycle, WebSocket event discriminated unions,
 * and conversation data structures.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/** Turn detection configuration for server-side VAD. */
export interface TurnDetectionConfig {
  readonly type: 'server_vad'
  /** Energy threshold (0–1) above which speech is detected. */
  readonly threshold: number
  /** Milliseconds of audio prepended before detected speech onset. */
  readonly prefix_padding_ms: number
  /** Milliseconds of silence required to conclude a speech turn. */
  readonly silence_duration_ms: number
}

/** Top-level configuration object for the OpenAI Realtime API session. */
export interface RealtimeConfig {
  readonly model: 'gpt-4o-mini-realtime-preview' | 'gpt-4o-realtime-preview'
  readonly voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'sage' | 'ash' | 'coral'
  readonly modalities: readonly ('text' | 'audio')[]
  readonly turn_detection: TurnDetectionConfig
}

// ─── Session API ──────────────────────────────────────────────────────────────

/**
 * Successful response from POST /api/realtime/session.
 * The client_secret is an ephemeral, browser-safe token for WebRTC/WebSocket
 * connections directly to the OpenAI Realtime API.
 */
export interface SessionResponse {
  client_secret: string
  expires_at: number
}

/** Structured error response from POST /api/realtime/session. */
export interface SessionError {
  error: string
  code?: string
}

// ─── Connection State ─────────────────────────────────────────────────────────

/** Lifecycle states for a Realtime API WebSocket/WebRTC connection. */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

// ─── Server Event Discriminated Union ────────────────────────────────────────

/**
 * Fired when the session is first established with the Realtime API server.
 * Contains the full server-side session object.
 */
export interface SessionCreatedEvent {
  type: 'session.created'
  session: {
    id: string
    model: string
    voice: string
    modalities: string[]
  }
}

/**
 * Fired when the session configuration has been updated (e.g. after sending
 * a session.update client event).
 */
export interface SessionUpdatedEvent {
  type: 'session.updated'
  session: {
    id: string
    model: string
    voice: string
    modalities: string[]
  }
}

/** Fired when the server VAD detects the start of user speech. */
export interface InputAudioBufferSpeechStartedEvent {
  type: 'input_audio_buffer.speech_started'
  audio_start_ms: number
  item_id: string
}

/** Fired when the server VAD detects the end of user speech. */
export interface InputAudioBufferSpeechStoppedEvent {
  type: 'input_audio_buffer.speech_stopped'
  audio_end_ms: number
  item_id: string
}

/**
 * Incremental audio chunk from the model response.
 * `delta` is Base64-encoded PCM16 audio data.
 */
export interface ResponseAudioDeltaEvent {
  type: 'response.audio.delta'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  delta: string
}

/**
 * Incremental text transcript chunk from the model's audio response.
 * Used to display a real-time streaming transcript to the user.
 */
export interface ResponseAudioTranscriptDeltaEvent {
  type: 'response.audio_transcript.delta'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  delta: string
}

/**
 * Fired when the model has finished generating a full response turn.
 * Contains metadata about the completed response.
 */
export interface ResponseDoneEvent {
  type: 'response.done'
  response: {
    id: string
    status: 'completed' | 'cancelled' | 'failed' | 'incomplete'
    usage?: {
      total_tokens: number
      input_tokens: number
      output_tokens: number
    }
  }
}

/** Server-side error event from the Realtime API. */
export interface RealtimeErrorEvent {
  type: 'error'
  error: {
    type: string
    code: string
    message: string
    param?: string
    event_id?: string
  }
}

/**
 * Discriminated union of all OpenAI Realtime server events handled by this
 * application. Narrow on the `type` field to access event-specific properties.
 */
/**
 * Fired when a conversation item (user or assistant turn) is created.
 * Used to initialise a ConversationItem in the transcript list.
 */
export interface ConversationItemCreatedEvent {
  type: 'conversation.item.created'
  item: {
    id: string
    role: 'user' | 'assistant' | 'system'
    status: 'in_progress' | 'completed'
  }
}

/**
 * Fired when the assistant's audio transcript for a response item is complete.
 * The full transcript string is available here.
 */
export interface ResponseAudioTranscriptDoneEvent {
  type: 'response.audio_transcript.done'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  transcript: string
}

/**
 * Fired when Whisper has finished transcribing the user's audio input.
 * Requires `input_audio_transcription: { model: "whisper-1" }` in session config.
 */
export interface ConversationItemInputAudioTranscriptionCompletedEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  item_id: string
  content_index: number
  transcript: string
}

export type RealtimeEvent =
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseDoneEvent
  | RealtimeErrorEvent
  | ConversationItemCreatedEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent

// ─── Conversation Data ────────────────────────────────────────────────────────

/**
 * A single turn in the conversation, populated as transcripts arrive
 * or after a response turn completes.
 */
export interface ConversationItem {
  id: string
  role: 'user' | 'assistant'
  /** Accumulated transcript text for this turn. May be partial during streaming. */
  transcript: string
  timestamp: Date
}

// ─── Speaking State ───────────────────────────────────────────────────────────

/**
 * Represents who is currently speaking in the conversation.
 * Derived from VAD and audio delta events received on the data channel.
 */
export type SpeakingState = 'idle' | 'user_speaking' | 'ai_speaking'
