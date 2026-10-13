'use client'

import Image from 'next/image'

export default function PracticeComingSoonPage() {
  return (
    <div style={{
      width: '100%',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 32,
        padding: '60px 40px',
        maxWidth: 480,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.03)',
        border: '1px solid rgba(226,232,240,0.8)',
      }}>
        
        {/* Cat GIF Container */}
        <div style={{
          width: 124, height: 69,
          position: 'relative',
          marginBottom: 32,
        }}>
          <Image 
            src="/Cat%20Crying%20emojiSticker%20animation.gif" 
            alt="Sad Cat Crying" 
            fill 
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: '#0F172A',
          margin: 0,
          fontFamily: 'var(--font-display)',
          lineHeight: 1.2,
          letterSpacing: '-0.5px'
        }}>
          Practice Mode is Coming Soon!
        </h1>


        
      </div>
    </div>
  )
}
