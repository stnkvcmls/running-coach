import type { ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import './AlertBanner.css'

interface Props {
  message: ReactNode
  actionLabel: string
  onAction: () => void
  onDismiss: () => void
  pending?: boolean
}

/** Compact one-line banner for actionable, dismissible warnings (e.g. plan realignment). */
export default function AlertBanner({ message, actionLabel, onAction, onDismiss, pending }: Props) {
  return (
    <div className="alert-banner">
      <AlertTriangle size={14} className="alert-banner-icon" />
      <span className="alert-banner-msg">{message}</span>
      <button className="alert-banner-action" onClick={onAction} disabled={pending}>
        {pending ? <RefreshCw size={12} className="spin" /> : null}
        {actionLabel}
      </button>
      <button className="alert-banner-dismiss" onClick={onDismiss} disabled={pending}>
        Dismiss
      </button>
    </div>
  )
}
