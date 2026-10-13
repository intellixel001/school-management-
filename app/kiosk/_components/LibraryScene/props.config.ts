export type DepthLayer = 'near' | 'mid' | 'far'
export type MotionPreset = 'gentle-sway' | 'bob-tilt' | 'page-turn' | 'writing-rock' | 'slow-drift' | 'subtle-breath' | 'flame-flicker' | 'hang-swing'

export interface LibraryPropConfig {
  id: string
  url: string
  x: number // percentage (0-100)
  y: number // percentage (0-100)
  size: number // px width
  depth: DepthLayer
  motion: MotionPreset
  rotate: number // initial rotation in degrees
  enabled: boolean
}

// Final asset configurations

export const libraryProps: LibraryPropConfig[] = [
  {
    id: 'shakespeare-bust',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990633/shakespeare-bust_wxropg.webp',
    x: 82,
    y: 22,
    size: 280,
    depth: 'near',
    motion: 'gentle-sway',
    rotate: -3,
    enabled: true
  },
  {
    id: 'ai-bot',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990636/ai-bot-writing_2_vfwl76.webp',
    x: 18,
    y: 24,
    size: 200,
    depth: 'mid',
    motion: 'bob-tilt',
    rotate: 0,
    enabled: false
  },
  {
    id: 'open-book',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990634/open-book_ppon9g.webp',
    x: 22,
    y: 78,
    size: 260,
    depth: 'near',
    motion: 'page-turn',
    rotate: -8,
    enabled: true
  },
  {
    id: 'ink-quill',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990634/ink-bottle_qjemwv.webp',
    x: 82,
    y: 78,
    size: 250,
    depth: 'near',
    motion: 'writing-rock',
    rotate: 4,
    enabled: true
  },
  {
    id: 'typewriter',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990633/typewriter_jahbgb.webp',
    x: 22,
    y: 68,
    size: 280,
    depth: 'near',
    motion: 'slow-drift',
    rotate: 0,
    enabled: false
  },
  {
    id: 'leather-tomes',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1784053876/leather-book_mgwgcz.webp',
    x: 65,
    y: 75,
    size: 220,
    depth: 'mid',
    motion: 'subtle-breath',
    rotate: 0,
    enabled: false
  },
  {
    id: 'brass-candle',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1784053875/candle_ueymrf.webp',
    x: 20,
    y: 20,
    size: 200,
    depth: 'near',
    motion: 'flame-flicker',
    rotate: 0,
    enabled: true
  },
  {
    id: 'sealed-letter',
    url: 'https://res.cloudinary.com/dvvcwzp4n/image/upload/v1784053875/letter_m3hgpx.webp',
    x: 75,
    y: 32,
    size: 150,
    depth: 'far',
    motion: 'hang-swing',
    rotate: 0,
    enabled: false
  }
]
