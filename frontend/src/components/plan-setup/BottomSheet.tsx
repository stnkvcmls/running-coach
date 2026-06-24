import { useEffect } from 'react'
import './BottomSheet.css'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="bs-overlay" onClick={onClose}>
      <div className="bs-panel" onClick={e => e.stopPropagation()}>
        <div className="bs-handle" />
        <div className="bs-header">
          <h2 className="bs-title">{title}</h2>
          <button className="bs-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="bs-body">{children}</div>
      </div>
    </div>
  )
}
