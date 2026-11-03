import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import '../activity-detail/ActivityDetailView.css'
import './SettingsView.css'

interface SettingsPageProps {
  title: string
  /** Where Back goes: a sub-page returns to the index; the index goes back in history. */
  backTo?: string
  /** Widen the body (zone tables need the room on desktop). */
  wide?: boolean
  children: ReactNode
}

/** Shared chrome for the Settings index and its sub-pages: back header + body. */
export default function SettingsPage({ title, backTo, wide = false, children }: SettingsPageProps) {
  const navigate = useNavigate()
  return (
    <div className="settings-view">
      <header className="detail-header">
        <button
          className="back-btn"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-info">
          <h1 className="detail-title">{title}</h1>
        </div>
      </header>
      <div className={`settings-body${wide ? ' settings-body--wide' : ''}`}>{children}</div>
    </div>
  )
}
