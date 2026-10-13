/**
 * @file hooks/realtime/use-realtime-connection.ts
 * @description Manages the full WebRTC lifecycle for an OpenAI Realtime API session.
 *
 * WebRTC negotiation flow (executed in order by `connect()`):
 *  1. POST /api/realtime/session  → ephemeral client token
 *  2. new RTCPeerConnection()
 *  3. Set pc.ontrack → pipe remote audio to hidden <audio> element
 *  4. getUserMedia({ audio: true }) → add local mic track to peer connection
 *  5. pc.createDataChannel("oai-events")
 *  6. pc.createOffer() + pc.setLocalDescription()
 *  7. POST offer SDP to OpenAI Realtime endpoint with ephemeral token
 *  8. pc.setRemoteDescription({ type: "answer", sdp: answerText })
 *  9. dc.onopen → send session.update (model config + instructions)
 *
 * Phase 5 additions:
 * - Automatic reconnection with exponential backoff (1s, 2s, 4s, max 3 attempts).
 *   A user-initiated `disconnect()` sets `intentionalDisconnectRef` to prevent
 *   retries from triggering on clean teardown.
 * - `reconnectAttempt` is exposed for UI feedback.
 * - `getConnectionQuality()` samples RTCPeerConnection stats for RTT.
 * - All console.log calls replaced with the conditional realtimeLog utility.
 */

"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type RefObject,
} from "react";
import { REALTIME_CONFIG } from "@/lib/realtime/config";
import {
  realtimeLog,
  realtimeWarn,
  realtimeError,
} from "@/lib/realtime/logger";
import type {
  ConnectionState,
  SessionResponse,
  SessionError,
} from "@/types/realtime";

// ─── Constants ────────────────────────────────────────────────────────────────

const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime";

/**
 * Default session instructions for the /realtime dev page.
 * Exported so the existing page can pass it to the hook after parameterization.
 */
export const DEFAULT_SESSION_INSTRUCTIONS =
  `You are Echo, a friendly and warm English speaking coach. ` +
  `You talk like a real human — casual, natural, and encouraging. ` +
  `\n\n` +
  `YOUR PERSONALITY:\n` +
  `- You are always warm, supportive, and conversational.\n` +
  `- You can chat casually about anything — greetings, small talk, questions about you — respond naturally.\n` +
  `- You genuinely care about helping the user improve their English.\n` +
  `\n` +
  `DETECTING PRACTICE INTENT:\n` +
  `- If the user says anything like "I want to improve my English", "can you help me with my speaking", ` +
  `"I want to practice", or similar — this is your trigger to start the speaking assessment.\n` +
  `- When triggered, respond warmly, confirm you are happy to help, and ask if they are ready to begin.\n` +
  `- Once they confirm they are ready (or show enthusiasm), start asking the questions.\n` +
  `\n` +
  `THE 3 ASSESSMENT QUESTIONS — ask in this exact order, one at a time:\n` +
  `Question 1: "Can you tell me a little about yourself — your name, where you're from, and what you do?"\n` +
  `Question 2: "What is something you enjoy doing in your free time, and why do you enjoy it?"\n` +
  `Question 3: "If you could live in any country in the world, which one would you choose and why?"\n` +
  `\n` +
  `HOW TO ASK THE QUESTIONS:\n` +
  `- Ask only ONE question at a time. Never combine or rush.\n` +
  `- After each answer, give a short warm reaction — one sentence only — then ask the next question.\n` +
  `- Example reactions: "That's lovely!", "Oh interesting!", "Great!", "I like that!"\n` +
  `- After the user answers Question 3, say something like: "That was amazing! Let me now share some quick feedback on your English."\n` +
  `\n` +
  `GIVING THE DEMO SCORE:\n` +
  `- After all 3 answers, give a light, encouraging spoken score out of 10.\n` +
  `- Base it loosely on how clearly they communicated, the vocabulary they used, and how confident they sounded.\n` +
  `- Be generous — this is a demo, not a formal exam.\n` +
  `- Keep it under 60 words, spoken naturally.\n` +
  `- Format: score → something they did well → one tip → encouraging close.\n` +
  `- Example: "I'd say a strong 8 out of 10! You communicated really clearly and your answers were well-structured. ` +
  `Try using a wider range of vocabulary next time. Overall though — you should feel great about that!"\n` +
  `\n` +
  `AFTER THE SCORE:\n` +
  `- The conversation does NOT end. Stay available and friendly.\n` +
  `- The user can ask follow-up questions, discuss their score, ask for tips, or just keep chatting.\n` +
  `- Respond naturally to whatever they say next — like a real coach would after a session.\n` +
  `\n` +
  `GENERAL RULES:\n` +
  `- Always sound human. Never robotic or scripted.\n` +
  `- Never ask two questions at once.\n` +
  `- Never repeat a question the user already answered.\n` +
  `- If the user goes off-topic mid-assessment, gently and kindly bring them back.`;

/** Reconnection strategy: delays in ms for attempt 0, 1, 2 */
const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000] as const;
const MAX_RECONNECT_ATTEMPTS = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionQuality = "good" | "fair" | "poor" | "unknown";

export interface UseRealtimeConnectionReturn {
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  dcRef: RefObject<RTCDataChannel | null>;
  remoteStreamRef: RefObject<MediaStream | null>;
  reconnectAttempt: number;
  getConnectionQuality: () => Promise<ConnectionQuality>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimeConnection(
  micStream: MediaStream | null,
  sessionInstructions: string,
): UseRealtimeConnectionReturn {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // ── Mutable refs ──────────────────────────────────────────────────────────
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  /** Set true before a user-initiated disconnect to suppress reconnection. */
  const intentionalDisconnectRef = useRef(false);
  /** Tracks number of consecutive automatic reconnect attempts. */
  const reconnectAttemptRef = useRef(0);
  /** Holds the pending reconnect setTimeout id for cleanup. */
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clearReconnectTimer = useCallback((): void => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Store instructions in a ref so the sendSessionUpdate callback stays stable
  // while the instructions can be updated by the caller without re-triggering
  // reconnections.
  const instructionsRef = useRef(sessionInstructions);
  useEffect(() => {
    instructionsRef.current = sessionInstructions;
  }, [sessionInstructions]);

  const sendSessionUpdate = useCallback((dc: RTCDataChannel): void => {
    const event = {
      type: "session.update",
      session: {
        modalities: Array.from(REALTIME_CONFIG.modalities),
        voice: REALTIME_CONFIG.voice,
        turn_detection: { ...REALTIME_CONFIG.turn_detection },
        input_audio_transcription: { model: 'whisper-1', language: 'en' },
        instructions: instructionsRef.current,
      },
    };
    realtimeLog("connect", "Sending session.update");
    dc.send(JSON.stringify(event));
  }, []);

  // ── Teardown (idempotent) ─────────────────────────────────────────────────

  const teardown = useCallback((): void => {
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    remoteStreamRef.current = null;
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  // ── Core connect logic ────────────────────────────────────────────────────

  const connect = useCallback(async (): Promise<void> => {
    if (connectionState === "connecting" || connectionState === "connected") {
      realtimeWarn(
        "connect",
        "Already connecting/connected — ignoring duplicate call",
      );
      return;
    }
    if (!micStream) {
      realtimeError("connect", "No microphone stream — cannot connect");
      setConnectionState("error");
      return;
    }

    setConnectionState("connecting");

    try {
      // Step 1 — Ephemeral token
      realtimeLog("connect", "Fetching ephemeral token…");
      const tokenRes = await fetch("/api/realtime/session", { method: "POST" });

      if (!tokenRes.ok) {
        const errData: unknown = await tokenRes.json().catch(() => null);
        let msg = `Token fetch failed: HTTP ${tokenRes.status}`;
        if (
          errData !== null &&
          typeof errData === "object" &&
          "error" in errData &&
          typeof (errData as SessionError).error === "string"
        ) {
          msg = (errData as SessionError).error;
        }
        throw new Error(msg);
      }

      const tokenData = (await tokenRes.json()) as SessionResponse;
      const ephemeralToken = tokenData.client_secret;
      realtimeLog(
        "connect",
        "Token acquired, expires_at:",
        tokenData.expires_at,
      );

      // Step 2 — RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Step 3 — Remote audio
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      pc.ontrack = (event: RTCTrackEvent): void => {
        realtimeLog("connect", "Remote track received:", event.track.kind);
        if (event.streams[0]) {
          audioEl.srcObject = event.streams[0];
          remoteStreamRef.current = event.streams[0];
        } else {
          const ms = new MediaStream([event.track]);
          audioEl.srcObject = ms;
          remoteStreamRef.current = ms;
        }
      };

      // Monitor connection state for unexpected drops → trigger reconnect
      const handleConnectionDrop = (): void => {
        const state = pc.connectionState ?? pc.iceConnectionState;
        realtimeLog("connect", "Connection state change:", state);
        const dropped =
          state === "failed" || state === "disconnected" || state === "closed";
        if (dropped && !intentionalDisconnectRef.current) {
          realtimeWarn(
            "connect",
            "Unexpected connection drop — scheduling reconnect",
          );
          teardown();
          setConnectionState("connecting");
          scheduleReconnect();
        } else if (dropped) {
          setConnectionState("disconnected");
        }
      };

      pc.onconnectionstatechange = handleConnectionDrop;
      pc.oniceconnectionstatechange = (): void => {
        realtimeLog("connect", "ICE state:", pc.iceConnectionState);
        handleConnectionDrop();
      };

      // Step 4 — Mic tracks
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      // Step 5 — Data channel (must be before createOffer)
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = (): void => {
        realtimeLog("connect", "Data channel open");
        sendSessionUpdate(dc);
        // Successful connection — reset the attempt counter
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        setConnectionState("connected");
      };

      dc.onclose = (): void => {
        realtimeLog("connect", "Data channel closed");
        if (!intentionalDisconnectRef.current) {
          scheduleReconnect();
        }
      };

      dc.onerror = (event: Event): void => {
        realtimeError("connect", "Data channel error:", event);
        if (!intentionalDisconnectRef.current) {
          scheduleReconnect();
        }
      };

      // Steps 6–8 — SDP offer/answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      realtimeLog("connect", "Local description set (offer)");

      const sdpUrl = `${OPENAI_REALTIME_URL}?model=${encodeURIComponent(REALTIME_CONFIG.model)}`;
      const sdpRes = await fetch(sdpUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-Type": "application/sdp",
        },
        body: pc.localDescription!.sdp,
      });

      if (!sdpRes.ok) {
        const errText = await sdpRes.text().catch(() => sdpRes.statusText);
        throw new Error(`SDP exchange failed: ${sdpRes.status} — ${errText}`);
      }

      const answerSdp = await sdpRes.text();
      realtimeLog(
        "connect",
        "Received SDP answer — setting remote description",
      );
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      realtimeLog("connect", "Remote description set — awaiting dc.onopen");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown WebRTC error";
      realtimeError("connect", "connect() failed:", message);
      teardown();
      if (!intentionalDisconnectRef.current) {
        scheduleReconnect();
      } else {
        setConnectionState("error");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, micStream, sendSessionUpdate, teardown]);

  // ── Reconnection scheduler ────────────────────────────────────────────────

  // Declared with useRef to avoid circular dependency with connect's useCallback
  const connectRef = useRef(connect);
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const scheduleReconnect = useCallback((): void => {
    clearReconnectTimer();
    const attempt = reconnectAttemptRef.current;

    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
      realtimeError(
        "reconnect",
        `Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`,
      );
      setConnectionState("error");
      reconnectAttemptRef.current = 0;
      setReconnectAttempt(0);
      return;
    }

    const delay =
      RECONNECT_DELAYS_MS[attempt] ??
      RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1];
    realtimeLog(
      "reconnect",
      `Attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`,
    );

    reconnectAttemptRef.current = attempt + 1;
    setReconnectAttempt(attempt + 1);
    setConnectionState("connecting");

    reconnectTimerRef.current = setTimeout(() => {
      connectRef.current();
    }, delay);
  }, [clearReconnectTimer]);

  // ── User-initiated disconnect ─────────────────────────────────────────────

  const disconnect = useCallback((): void => {
    realtimeLog("connect", "User-initiated disconnect");
    intentionalDisconnectRef.current = true;
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;
    setReconnectAttempt(0);
    teardown();
    setConnectionState("disconnected");
    // Reset the flag after the current call stack (so event handlers see it)
    setTimeout(() => {
      intentionalDisconnectRef.current = false;
    }, 0);
  }, [clearReconnectTimer, teardown]);

  // ── Connection quality probe ──────────────────────────────────────────────

  const getConnectionQuality =
    useCallback(async (): Promise<ConnectionQuality> => {
      const pc = pcRef.current;
      if (!pc || pc.connectionState !== "connected") return "unknown";
      try {
        const stats = await pc.getStats();
        let rttMs: number | null = null;
        stats.forEach((report) => {
          if (
            report.type === "candidate-pair" &&
            (report as RTCIceCandidatePairStats).state === "succeeded" &&
            typeof (report as RTCIceCandidatePairStats).currentRoundTripTime ===
              "number"
          ) {
            const candidate = report as RTCIceCandidatePairStats;
            // currentRoundTripTime is in seconds per the spec
            rttMs = candidate.currentRoundTripTime! * 1_000;
          }
        });
        if (rttMs === null) return "unknown";
        if (rttMs < 200) return "good";
        if (rttMs < 500) return "fair";
        return "poor";
      } catch {
        return "unknown";
      }
    }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      intentionalDisconnectRef.current = true;
      clearReconnectTimer();
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    dcRef,
    remoteStreamRef,
    reconnectAttempt,
    getConnectionQuality,
  };
}
