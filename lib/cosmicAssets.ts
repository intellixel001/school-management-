export interface CosmicAsset {
  id: string;
  url: string;
  type: "book" | "writing-tool" | "decor" | "mascot";
  minScale: number;
  maxScale: number;
  naturalAspect: number; // width / height
}

export const COSMIC_ASSETS: CosmicAsset[] = [
  // ── NEW LITERATURE ASSETS ──
  {
    id: "typewriter",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990633/typewriter_jahbgb.webp",
    type: "writing-tool",
    minScale: 120,
    maxScale: 200,
    naturalAspect: 1,
  },
  {
    id: "scroll-parchment",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990633/scroll-parchment_htvu4u.webp",
    type: "writing-tool",
    minScale: 100,
    maxScale: 160,
    naturalAspect: 1,
  },
  {
    id: "ink-bottle",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990634/ink-bottle_qjemwv.webp",
    type: "writing-tool",
    minScale: 80,
    maxScale: 140,
    naturalAspect: 1,
  },
  {
    id: "led-lamp",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990634/led-lamp_a9fcxp.webp",
    type: "decor",
    minScale: 120,
    maxScale: 180,
    naturalAspect: 1,
  },
  {
    id: "shakespeare-bust",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990633/shakespeare-bust_wxropg.webp",
    type: "decor",
    minScale: 100,
    maxScale: 180,
    naturalAspect: 1,
  },
  {
    id: "open-book",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990634/open-book_ppon9g.webp",
    type: "book",
    minScale: 140,
    maxScale: 220,
    naturalAspect: 1,
  },
  {
    id: "english-learning",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990634/English_Learning_ggx2qw.webp",
    type: "book",
    minScale: 100,
    maxScale: 180,
    naturalAspect: 1,
  },

  // ── MASCOTS ──
  {
    id: "ai-mascot-1",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1781826309/ai-mascot-1_g5pnhp.webp",
    type: "mascot",
    minScale: 70,
    maxScale: 120,
    naturalAspect: 1,
  },
  {
    id: "ai-mascot-2",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1781826309/ai-maskot-2_ref0po.webp",
    type: "mascot",
    minScale: 90,
    maxScale: 140,
    naturalAspect: 1,
  },
  {
    id: "ai-tutor",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1781763718/ai-tutor_mhpmvw.png",
    type: "mascot",
    minScale: 100,
    maxScale: 180,
    naturalAspect: 453 / 819,
  },
  {
    id: "ai-bot-reading",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1781984685/ai-bot-reading_ai9qeb.webp",
    type: "mascot",
    minScale: 100,
    maxScale: 200,
    naturalAspect: 1536 / 2778,
  },
  {
    id: "ai-bot-writing",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1783990636/ai-bot-writing_2_vfwl76.webp",
    type: "mascot",
    minScale: 100,
    maxScale: 200,
    naturalAspect: 1,
  },
  {
    id: "ai-bot-listening",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1781984684/ai-bot-listening_ixzl8q.webp",
    type: "mascot",
    minScale: 100,
    maxScale: 200,
    naturalAspect: 1536 / 2778,
  },
  {
    id: "ai-bot-speaking",
    url: "https://res.cloudinary.com/dvvcwzp4n/image/upload/v1781984684/ai-bot-speaking_dtakor.webp",
    type: "mascot",
    minScale: 100,
    maxScale: 200,
    naturalAspect: 1536 / 2778,
  },
];

export function getAssetsByType(type: CosmicAsset["type"]): CosmicAsset[] {
  return COSMIC_ASSETS.filter((a) => a.type === type);
}

// PRNG: xmur3
function xmur3(str: string) {
  for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// PRNG: mulberry32
function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed: string) {
  const seedGen = xmur3(seed);
  return mulberry32(seedGen());
}

export function pickAssets(
  seed: string,
  count: number,
  types?: CosmicAsset["type"][],
  allowRepeat: boolean = false,
): CosmicAsset[] {
  const rand = createSeededRandom(seed);
  let pool = types
    ? COSMIC_ASSETS.filter((a) => types.includes(a.type))
    : [...COSMIC_ASSETS];

  const picked: CosmicAsset[] = [];
  // Copy pool to avoid mutating global
  const available = [...pool];

  for (let i = 0; i < count; i++) {
    if (available.length === 0) break;
    const index = Math.floor(rand() * available.length);
    picked.push(available[index]);
    if (!allowRepeat) {
      available.splice(index, 1);
    }
  }

  return picked;
}
