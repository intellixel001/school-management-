import { Skeleton } from '@/components/ui/primitives/Skeleton'
import { DashboardBackground } from './_components/DashboardBackground'

export default function StudentLoading() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 1160, margin: '0 auto' }}>
      <DashboardBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Hero skeleton */}
        <Skeleton height={220} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />

        {/* Insight Strip skeleton */}
        <Skeleton height={60} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={100} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />
          ))}
        </div>

        {/* Main Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_356px]" style={{ gap: 20, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Skills */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '22px 24px' }}>
               <Skeleton height={20} width={120} style={{ marginBottom: 20, background: 'rgba(99,102,241,0.12)' }} />
               <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
                 {[...Array(4)].map((_, i) => <Skeleton key={i} height={84} width={84} borderRadius="50%" style={{ background: 'rgba(99,102,241,0.12)' }} />)}
               </div>
            </div>
            {/* Recent Sessions */}
            <Skeleton height={280} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />
            {/* Mocks */}
            <Skeleton height={200} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Jump In */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 22, boxShadow: '0 0 0 1px rgba(99,102,241,0.10)' }}>
              <Skeleton height={206} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />
            </div>
            {/* Today's Goal */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 22, boxShadow: '0 0 0 1px rgba(99,102,241,0.10)' }}>
              <Skeleton height={126} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />
            </div>
            {/* Streak */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 22, boxShadow: '0 0 0 1px rgba(99,102,241,0.10)' }}>
              <Skeleton height={176} borderRadius="var(--radius-lg)" style={{ background: 'rgba(99,102,241,0.12)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
