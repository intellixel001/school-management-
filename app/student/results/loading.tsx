import { Skeleton } from '@/components/ui/primitives/Skeleton'

export default function ResultsLoading() {
  return (
    <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Skeleton height={32} width={180} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width={260} />
      </div>
      {/* Filter bar skeleton */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[80, 130, 120, 140].map((w, i) => (
          <Skeleton key={i} height={32} width={w} borderRadius="var(--radius-full)" />
        ))}
      </div>
      {/* Result cards */}
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height={100} borderRadius="var(--radius-lg)" style={{ marginBottom: 12 }} />
      ))}
    </div>
  )
}
