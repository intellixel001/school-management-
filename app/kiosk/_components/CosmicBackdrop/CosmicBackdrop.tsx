'use client'

import { useMemo } from 'react'
import Nebula from './Nebula'
import Starfield from './Starfield'
import Decoration from './Decoration'
import { pickAssets, createSeededRandom, type CosmicAsset } from '@/lib/cosmicAssets'

export interface CosmicBackdropProps {
  accent?: 'cyan' | 'indigo' | 'amber' | 'emerald'
  density?: 'full' | 'card' | 'minimal' | 'none'
  seed?: string
  className?: string
}

export default function CosmicBackdrop({
  accent = 'cyan',
  density = 'full',
  seed,
  className = ''
}: CosmicBackdropProps) {
  // If no seed provided, use accent as seed
  const activeSeed = seed || accent

  const decorations = useMemo(() => {
    const rand = createSeededRandom(activeSeed)
    
    // Pick assets based on density
    let assets: CosmicAsset[] = []
    if (density === 'full') {
      assets = [
        ...pickAssets(activeSeed + 'b', 2, ['book']),
        ...pickAssets(activeSeed + 'w', 3, ['writing-tool']),
        ...pickAssets(activeSeed + 'd', 2, ['decor']),
        ...pickAssets(activeSeed + 'm', 1, ['mascot']),
      ]
    } else if (density === 'card') {
      assets = [
        ...pickAssets(activeSeed + 'b', 1, ['book']),
        ...pickAssets(activeSeed + 'w', 2, ['writing-tool']),
        ...pickAssets(activeSeed + 'd', 1, ['decor']),
      ]
    } else if (density === 'minimal') {
      assets = [
        ...pickAssets(activeSeed + 'b', 1, ['book']),
        ...pickAssets(activeSeed + 'w', 1, ['writing-tool']),
      ]
    }

    // Cinematic composition tracking
    let bookCount = 0;
    let wtCount = 0;
    let decorCount = 0;
    let mascotCount = 0;
    
    return assets.map((asset, i) => {
      let xVal = 0;
      let yVal = 0;
      let depth: 'far' | 'mid' | 'near' = 'mid';
      let scale = asset.minScale + rand() * (asset.maxScale - asset.minScale);

      // =========================================================================
      // 🚀 HOW TO EDIT POSITIONS AND DEPTH MANUALLY
      // =========================================================================
      // Edit the `xVal` and `yVal` numbers below to change where things appear!
      //
      // • xVal: Horizontal position (0 = far left edge, 100 = far right edge)
      // • yVal: Vertical position (0 = top edge, 100 = bottom edge)
      // • depth: 'near' (foreground, large/fast), 'mid' (middle), 'far' (background, small/slow)
      // • scale: You can override the size by forcing a number, e.g., `scale = 150;`
      // 
      // TIP: To place something exactly in one spot without it moving on reload,
      // just remove the `+ (rand() * ...)` math and use a flat number!
      // Example: `xVal = 80; yVal = 20;`
      // =========================================================================

      if (asset.type === 'book') {
        depth = 'mid'; 
        if (bookCount === 0) {
          xVal = 85 + (rand() * 6 - 3); 
          yVal = 25 + (rand() * 6 - 3); 
        } else {
          xVal = 15 + (rand() * 6 - 3); 
          yVal = 75 + (rand() * 6 - 3); 
        }
        bookCount++;
      } 
      else if (asset.type === 'writing-tool') {
        depth = 'far';
        if (wtCount === 0) {
          xVal = 35 + (rand() * 6 - 3); 
          yVal = 80 + (rand() * 6 - 3); 
        } else if (wtCount === 1) {
          xVal = 85 + (rand() * 6 - 3); 
          yVal = 85 + (rand() * 6 - 3); 
        } else {
          xVal = 35 + (rand() * 6 - 3); 
          yVal = 20 + (rand() * 6 - 3); 
        }
        wtCount++;
      }
      else if (asset.type === 'decor') {
        depth = 'near';
        if (decorCount === 0) {
          xVal = 65 + (rand() * 6 - 3); 
          yVal = 75 + (rand() * 6 - 3);
        } else {
          xVal = 15 + (rand() * 6 - 3); 
          yVal = 15 + (rand() * 6 - 3);
        }
        decorCount++;
      }
      else if (asset.type === 'mascot') {
        depth = 'mid';
        xVal = 65 + (rand() * 6 - 3); 
        yVal = 15 + (rand() * 6 - 3); 
        scale = asset.maxScale;
        mascotCount++;
      }

      const x = `${xVal}%`;
      const y = `${yVal}%`;

      return {
        id: `${asset.id}-${i}`,
        asset,
        position: { x, y },
        scale,
        depth,
        seedOffset: rand(),
        priority: depth === 'near' || i === 0
      }
    })
  }, [density, activeSeed])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      <Nebula accent={accent} />
      <Starfield density={density === 'none' ? 'minimal' : density} />
      {decorations.map((deco) => (
        <Decoration
          key={deco.id}
          asset={deco.asset}
          position={deco.position}
          scale={deco.scale}
          depth={deco.depth}
          seedOffset={deco.seedOffset}
          priority={deco.priority}
        />
      ))}
    </div>
  )
}
