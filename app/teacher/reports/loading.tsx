import { Skeleton } from '@/components/ui/primitives/Skeleton'

export default function ReportsLoading() {
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <Skeleton height={32} width={160} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width={280} />
      </div>
      {/* Snapshot cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }} className="snapshot-grid">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={100} borderRadius="var(--radius-lg)" />
        ))}
      </div>
      {/* Trend charts */}
      <Skeleton height={260} borderRadius="var(--radius-lg)" style={{ marginBottom: 20 }} />
      {/* Performance table */}
      <Skeleton height={400} borderRadius="var(--radius-lg)" />
    </div>
  )
}
