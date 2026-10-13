/**
 * @file server/voice-proxy.mjs
 * @description WebSocket proxy that bridges the browser to Alibaba's
 * Qwen-Omni-Realtime API. The browser cannot connect directly because the
 * QWEN_API_KEY must never leave the server. This proxy:
 *
 *   browser  <--ws://localhost:3001-->  this proxy  <--wss://dashscope-intl-->  Alibaba
 *
 * The proxy is a thin pipe — it forwards every message both ways with no
 * mutation. The only thing it does on top is inject the Authorization header
 * when opening the upstream connection.
 *
 * Run alongside `next dev`:
 *   npm run voice-proxy           (terminal A)
 *   npm run dev                   (terminal B)
 * or both at once:
 *   npm run dev:all
 *
 * Environment:
 *   QWEN_API_KEY            — required, from .env.local
 *   VOICE_PROXY_PORT        — optional, default 3001
 *   QWEN_REALTIME_MODEL     — optional, default qwen3-omni-flash-2025-12-01
 *   QWEN_REALTIME_REGION    — optional, default "intl" (Singapore). Use "cn" for Beijing.
 */

import { WebSocketServer, WebSocket } from 'ws'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Load .env.local manually (no dotenv dep) ─────────────────────────────────
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envText = readFileSync(envPath, 'utf-8')
  for (const line of envText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // .env.local not found — rely on shell env
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = Number(process.env.VOICE_PROXY_PORT ?? 3001)
const MODEL = process.env.QWEN_REALTIME_MODEL ?? 'qwen3-omni-flash-realtime'
const REGION = (process.env.QWEN_REALTIME_REGION ?? 'intl').toLowerCase()
const WORKSPACE_ID = process.env.QWEN_WORKSPACE_ID
const QWEN_API_KEY = process.env.QWEN_API_KEY

if (!QWEN_API_KEY) {
  console.error('[voice-proxy] ERROR: QWEN_API_KEY is not set in .env.local')
  process.exit(1)
}

// Build the right WSS URL per region. Singapore uses a workspace-scoped host.
function buildUpstreamUrl() {
  if (REGION === 'cn') {
    return `wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=${encodeURIComponent(MODEL)}`
  }
  // Singapore / International
  if (!WORKSPACE_ID) {
    console.error('[voice-proxy] ERROR: QWEN_WORKSPACE_ID is required for the Singapore region. Add it to .env.local.')
    process.exit(1)
  }
  return `wss://${WORKSPACE_ID}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=${encodeURIComponent(MODEL)}`
}
const UPSTREAM_URL = buildUpstreamUrl()

// ─── Server ───────────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT, path: '/qwen-realtime' })

wss.on('listening', () => {
  console.log(`[voice-proxy] listening on ws://localhost:${PORT}/qwen-realtime`)
  console.log(`[voice-proxy] upstream: ${UPSTREAM_URL}`)
})

wss.on('connection', (clientWs, req) => {
  const clientId = Math.random().toString(36).slice(2, 8)
  console.log(`[voice-proxy:${clientId}] client connected from ${req.socket.remoteAddress}`)

  // Open upstream WebSocket to Alibaba (Singapore workspace endpoint)
  const upstreamWs = new WebSocket(UPSTREAM_URL, {
    headers: {
      Authorization: `Bearer ${QWEN_API_KEY}`,
    },
  })

  let upstreamReady = false
  const pendingFromClient = []

  upstreamWs.on('open', () => {
    upstreamReady = true
    console.log(`[voice-proxy:${clientId}] upstream connected`)
    // Drain anything the client sent before upstream was ready
    for (const buf of pendingFromClient) upstreamWs.send(buf)
    pendingFromClient.length = 0
  })

  upstreamWs.on('message', (data, isBinary) => {
    // Log raw message for debugging — strip after things work
    if (isBinary) {
      console.log(`[voice-proxy:${clientId}] upstream binary frame: ${data.length} bytes`)
    } else {
      const text = data.toString('utf8')
      const preview = text.length > 400 ? text.slice(0, 400) + '…' : text
      console.log(`[voice-proxy:${clientId}] upstream ↓ ${preview}`)
    }
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary })
    }
  })

  upstreamWs.on('close', (code, reason) => {
    const reasonStr = reason && reason.length ? reason.toString('utf8') : ''
    console.log(`[voice-proxy:${clientId}] upstream closed: ${code} "${reasonStr}"`)
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close(code, reasonStr)
  })

  upstreamWs.on('error', (err) => {
    console.error(`[voice-proxy:${clientId}] upstream error:`, err.message)
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'error',
        error: { type: 'upstream_error', code: 'upstream_error', message: err.message },
      }))
    }
  })

  clientWs.on('message', (data, isBinary) => {
    if (!isBinary) {
      const text = data.toString('utf8')
      // Don't spam the log with audio buffer chunks — preview short, redact long
      try {
        const parsed = JSON.parse(text)
        const type = parsed.type
        if (type === 'input_audio_buffer.append') {
          // Audio chunk — log occasionally so we know data is flowing
          // (every ~50 chunks = ~5s of audio)
          if (!clientWs.__audioChunkCount) clientWs.__audioChunkCount = 0
          clientWs.__audioChunkCount++
          if (clientWs.__audioChunkCount % 50 === 1) {
            console.log(`[voice-proxy:${clientId}] client ↑ input_audio_buffer.append (chunk #${clientWs.__audioChunkCount})`)
          }
        } else {
          const preview = text.length > 500 ? text.slice(0, 500) + '…' : text
          console.log(`[voice-proxy:${clientId}] client ↑ ${preview}`)
        }
      } catch {
        console.log(`[voice-proxy:${clientId}] client ↑ (non-JSON ${text.length} bytes)`)
      }
    }
    if (!upstreamReady) {
      pendingFromClient.push(data)
      return
    }
    if (upstreamWs.readyState === WebSocket.OPEN) {
      upstreamWs.send(data, { binary: isBinary })
    }
  })

  clientWs.on('close', (code, reason) => {
    console.log(`[voice-proxy:${clientId}] client closed: ${code} ${reason}`)
    if (upstreamWs.readyState === WebSocket.OPEN || upstreamWs.readyState === WebSocket.CONNECTING) {
      upstreamWs.close(1000, 'client closed')
    }
  })

  clientWs.on('error', (err) => {
    console.error(`[voice-proxy:${clientId}] client error:`, err.message)
  })
})

process.on('SIGINT', () => {
  console.log('[voice-proxy] shutting down')
  wss.close(() => process.exit(0))
})
