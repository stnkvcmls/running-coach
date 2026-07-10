import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, RefreshCw, AlertTriangle } from 'lucide-react'
import { useSyncStatus } from '../../api/hooks'
import { format } from '../../utils/date'
import './SyncStatusPill.css'

export default function SyncStatusPill() {
  const navigate = useNavigate()
  const { status, lastSyncedAt } = useSyncStatus()
  const [revealed, setRevealed] = useState(false)

  if (status === 'needs_reauth') {
    return (
      <button
        className="sync-pill sync-pill-warn"
        onClick={() => navigate('/settings')}
        title="Garmin session expired — tap to reconnect"
      >
        <AlertTriangle size={11} />
        Reconnect
      </button>
    )
  }

  // No current payload exposes a running-sync signal, so useSyncStatus never
  // returns 'syncing' today — branch kept for when one is wired up.
  if (status === 'syncing') {
    return (
      <span className="sync-pill" role="status" aria-label="Syncing">
        <RefreshCw size={11} className="spin" />
      </span>
    )
  }

  const timeLabel = lastSyncedAt ? format(new Date(lastSyncedAt), 'HH:mm') : null

  return (
    <button
      className="sync-pill"
      onClick={() => setRevealed(r => !r)}
      aria-label={timeLabel ? `Last synced ${timeLabel}` : 'No sync recorded yet'}
      title={timeLabel ? `Last synced ${timeLabel}` : 'No sync recorded yet'}
    >
      <Check size={11} />
      {revealed && timeLabel && <span className="sync-pill-time">{timeLabel}</span>}
    </button>
  )
}
