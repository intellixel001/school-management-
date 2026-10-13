import { Spinner } from '@/components/ui'

export default function Loading() {
  return (
    <div style={{
      width: '100%',
      minHeight: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      <Spinner size="lg" />
    </div>
  )
}
