import { Spinner } from '@/components/ui'

export default function KioskLoading() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        background: '#120A08',         // warm dark base (matches library theme)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spinner size="lg" color="#E8B96C" />
    </div>
  )
}
