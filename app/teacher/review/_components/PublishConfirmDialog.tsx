import React from 'react'

interface PublishConfirmDialogProps {
  title: string
  body: string
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

export function PublishConfirmDialog({ title, body, cancelLabel, confirmLabel, onCancel, onConfirm }: PublishConfirmDialogProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#111827' }}>{title}</h3>
        <p style={{ margin: 0, marginBottom: 24, fontSize: 15, color: '#4B5563', lineHeight: 1.6 }}>{body}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#4F46E5',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
