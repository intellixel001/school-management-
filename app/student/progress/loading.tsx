import { Skeleton } from '@/components/ui/primitives/Skeleton'

export default function ProgressLoading() {
  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <Skeleton height={32} width={200} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width={260} />
      </div>

      {/* Skill score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 24 }} className="skill-score-grid">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={110} borderRadius="var(--radius-lg)" />
        ))}
      </div>

      {/* Trend charts + calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 24 }} className="progress-main-grid">
        <Skeleton height={280} borderRadius="var(--radius-lg)" />
        <Skeleton height={180} borderRadius="var(--radius-lg)" />
      </div>

      {/* Recent sessions */}
      <Skeleton height={200} borderRadius="var(--radius-lg)" />
    </div>
  )
}
