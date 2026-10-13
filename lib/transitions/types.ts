export type TransitionKind =
  | 'pin-to-menu'          // PIN burst → warp tunnel
  | 'menu-to-voice'        // Voice card → orb
  | 'menu-to-practice'     // Practice card → light wash
  | 'menu-to-mock'         // Mock card → light wash
  | 'voice-to-menu'        // Orb collapse → warp tunnel
  | 'lightpage-to-menu'    // Practice/Mock → warp tunnel
  | 'any-to-pin'           // End Session → PIN backdrop
  | 'generic-fade'         // Fallback for unanchored routes

export interface TransitionParams {
  /** Bounding rect of the source element (for card-expand transitions). */
  sourceRect?: DOMRect
  /** Accent color of the source (for color-flood transitions). */
  accentColor?: string
  /** Burst origin point in viewport coords (for PIN→menu). */
  burstOrigin?: { x: number; y: number }
}
