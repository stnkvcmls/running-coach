import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useSyncStatus } from '../../api/hooks'
import './SyncStatusPill.css'

/** A last sync older than this earns a top-bar warning; anything fresher is
 * "nothing is wrong" and renders nothing (X4). */
export const STALE_SYNC_MS = 6 * 60 * 60 * 1000

const HOUR_MS = 60 * 60 * 1000
const CLOCK_TICK_MS = 60_000

/** Sync age in whole hours under two days, whole days after: a compact form
 * for the pill ("7 h") and a spelled-out one for its accessible name. */
export function describeSyncAge(ageMs: number): { short: string; long: string } {
  const hours = Math.floor(ageMs / HOUR_MS)
  if (hours < 48) return { short: `${hours} h`, long: `${hours} hours` }
  const days = Math.floor(hours / 24)
  return { short: `${days} d`, long: `${days} days` }
}

/** Wall clock that ticks every minute, so a sync that quietly goes stale shows
 * up even when the 60s status poll returns identical data (and so doesn't
 * re-render on its own). */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function SyncStatusPill() {
  const navigate = useNavigate()
  const { status, lastSyncedAt } = useSyncStatus()
  const now = useNow(CLOCK_TICK_MS)

  if (status === 'needs_reauth') {
    return (
      <button
        className="sync-pill sync-pill-warn"
        onClick={() => navigate('/settings/garmin')}
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

  // Healthy, or nothing to judge yet (status still loading / no sync ever
  // recorded): stay out of the way. Settings → System health lists the times.
  const lastSyncedMs = lastSyncedAt ? new Date(lastSyncedAt).getTime() : NaN
  if (Number.isNaN(lastSyncedMs) || now - lastSyncedMs <= STALE_SYNC_MS) return null

  const age = describeSyncAge(now - lastSyncedMs)
  return (
    <button
      className="sync-pill sync-pill-warn"
      onClick={() => navigate('/settings/garmin')}
      aria-label={`Last synced ${age.long} ago — open Settings`}
      title={`Last Garmin sync was ${age.long} ago — tap for sync settings`}
    >
      <AlertTriangle size={11} />
      Synced {age.short} ago
    </button>
  )
}
