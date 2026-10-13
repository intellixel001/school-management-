export function DashboardBackground() {
  return (
    <>
      {/* Base layer: the soft mesh gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 0%, rgba(99,102,241,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 90% 20%, rgba(79,70,229,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 60% 70% at 50% 100%, rgba(129,140,248,0.05) 0%, transparent 60%),
            transparent
          `,
        }}
      />
      {/* Overlay layer: the subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.6,
        }}
      />
    </>
  )
}
