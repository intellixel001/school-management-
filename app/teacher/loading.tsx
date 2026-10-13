import { Skeleton } from '@/components/ui/primitives/Skeleton'

export default function TeacherLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Heading */}
      <div>
        <Skeleton height={32} width={200} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width={280} />
      </div>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={106} borderRadius="var(--radius-lg)" />
        ))}
      </div>
      {/* Student list */}
      <Skeleton height={320} borderRadius="var(--radius-lg)" />
    </div>
  )
}
