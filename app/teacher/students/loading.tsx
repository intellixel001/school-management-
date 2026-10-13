import { Skeleton } from '@/components/ui/primitives/Skeleton'

export default function StudentsLoading() {
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Skeleton height={32} width={160} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width={180} />
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <Skeleton height={34} width={200} borderRadius="var(--radius-md)" />
        {[80, 70, 90, 130].map((w, i) => (
          <Skeleton key={i} height={34} width={w} borderRadius="var(--radius-full)" />
        ))}
      </div>
      {/* Student rows */}
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} height={72} borderRadius="var(--radius-lg)" style={{ marginBottom: 8 }} />
      ))}
    </div>
  )
}
