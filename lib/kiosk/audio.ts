'use client'

/**
 * Kiosk audio manager.
 *
 * - Short SFX (tap, keypad, burst, wrong-credentials) are preloaded into small
 *   HTMLAudioElement pools so rapid taps don't cut each other off.
 * - The background loop streams via a single HTMLAudioElement with `loop=true`
 *   and `preload="auto"` — the browser starts fetching immediately and playback
 *   begins as soon as enough is buffered, so the 9 MB file doesn't block start.
 * - Autoplay is browser-gated: the first user gesture (the "Touch anywhere to
 *   begin" tap on /kiosk) is what unlocks playback. Pre-gesture play() calls
 *   reject silently and are retried by the caller.
 */

const AUDIO_SRC = {
  tap:              '/audio/tap.mp3',
  keypadBeep:       '/audio/num-keypad-beep.mp3',
  removeBeep:       '/audio/remove-keypad-beep.mp3',
  loginBurst:       '/audio/log-in-burst.mp3',
  wrongCredentials: '/audio/wrong-credentials.mp3',
  bg:               '/audio/kiosk-bg.mp3',
} as const

type SfxKey = 'tap' | 'keypadBeep' | 'removeBeep' | 'loginBurst' | 'wrongCredentials'

// Per-SFX pool size + volume — tuned so rapid taps don't clip and levels sit
// under the bg loop without being lost.
const SFX_CONFIG: Record<SfxKey, { size: number; volume: number }> = {
  tap:              { size: 3, volume: 0.7 },
  keypadBeep:       { size: 2, volume: 0.55 },
  removeBeep:       { size: 2, volume: 0.55 },
  loginBurst:       { size: 1, volume: 0.8 },
  wrongCredentials: { size: 1, volume: 0.75 },
}

const BG_BASE_VOLUME = 0.35   // subtle background at "full"
const BG_DUCK_FACTOR = 0.5    // halved when a modal is open

interface SfxPool {
  pool: HTMLAudioElement[]
  idx:  number
}

class KioskAudioManager {
  private sfx: Partial<Record<SfxKey, SfxPool>> = {}
  private bg:  HTMLAudioElement | null = null
  private initialised = false
  private ducked = false

  init(): void {
    if (this.initialised || typeof window === 'undefined') return
    this.initialised = true

    for (const key of Object.keys(SFX_CONFIG) as SfxKey[]) {
      const { size, volume } = SFX_CONFIG[key]
      const pool: HTMLAudioElement[] = []
      for (let i = 0; i < size; i++) {
        const a = new Audio(AUDIO_SRC[key])
        a.preload = 'auto'
        a.volume  = volume
        pool.push(a)
      }
      this.sfx[key] = { pool, idx: 0 }
    }

    this.bg = new Audio(AUDIO_SRC.bg)
    this.bg.loop     = true
    this.bg.preload  = 'auto'
    this.bg.volume   = BG_BASE_VOLUME
  }

  private play(key: SfxKey): void {
    const s = this.sfx[key]
    if (!s) return
    const a = s.pool[s.idx]
    s.idx = (s.idx + 1) % s.pool.length
    try {
      a.currentTime = 0
      const p = a.play()
      if (p && typeof p.catch === 'function') p.catch(() => { /* pre-gesture */ })
    } catch { /* ignore */ }
  }

  playTap()               { this.play('tap') }
  playKeypadBeep()        { this.play('keypadBeep') }
  playRemoveBeep()        { this.play('removeBeep') }
  playLoginBurst()        { this.play('loginBurst') }
  playWrongCredentials()  { this.play('wrongCredentials') }

  /** Attempts to start the bg loop. Safe to call before the first gesture —
   *  the browser will reject and the caller can retry on the next tap. */
  playBg(): void {
    if (!this.bg) return
    if (!this.bg.paused) return   // already playing
    const p = this.bg.play()
    if (p && typeof p.catch === 'function') p.catch(() => { /* pre-gesture */ })
  }

  pauseBg(): void { this.bg?.pause() }

  stopBg(): void {
    if (!this.bg) return
    this.bg.pause()
    try { this.bg.currentTime = 0 } catch { /* seek can fail before ready */ }
  }

  setBgDucked(ducked: boolean): void {
    this.ducked = ducked
    if (!this.bg) return
    this.bg.volume = ducked ? BG_BASE_VOLUME * BG_DUCK_FACTOR : BG_BASE_VOLUME
  }

  isBgDucked(): boolean { return this.ducked }
}

let instance: KioskAudioManager | null = null

function get(): KioskAudioManager {
  if (!instance) instance = new KioskAudioManager()
  return instance
}

export const kioskAudio = {
  init:                 () => get().init(),
  playTap:              () => get().playTap(),
  playKeypadBeep:       () => get().playKeypadBeep(),
  playRemoveBeep:       () => get().playRemoveBeep(),
  playLoginBurst:       () => get().playLoginBurst(),
  playWrongCredentials: () => get().playWrongCredentials(),
  playBg:               () => get().playBg(),
  pauseBg:              () => get().pauseBg(),
  stopBg:               () => get().stopBg(),
  setBgDucked:          (d: boolean) => get().setBgDucked(d),
}
