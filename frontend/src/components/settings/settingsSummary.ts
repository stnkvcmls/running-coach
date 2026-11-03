// Pure formatters for the values shown on the Settings index rows. Each
// returns null when there's nothing worth showing, so the row just omits it.
import type {
  AthleteProfile,
  CoachMemory,
  GarminConnectionStatus,
  NotificationPreferencesResponse,
  SystemHealthResponse,
} from '../../api/types'
import type { ThemePreference } from '../../hooks/useThemePreference'
import { formatPace } from '../../utils/formatting'

export type RowTone = 'ok' | 'warn'

export interface RowValue {
  text: string
  /** Status dot before the value: 'ok' (zone-3 green) or 'warn' (danger). */
  tone?: RowTone
}

export function profileSummary(profile: AthleteProfile | null | undefined): string | null {
  if (!profile) return null
  const parts = [profile.name?.trim() || null, profile.age != null ? String(profile.age) : null]
  const text = parts.filter(Boolean).join(', ')
  return text || null
}

export function thresholdsSummary(profile: AthleteProfile | null | undefined): string | null {
  if (!profile) return null
  const parts = [
    profile.threshold_pace_min_km ? `${formatPace(profile.threshold_pace_min_km)} /km` : null,
    profile.threshold_hr ? `${profile.threshold_hr} bpm` : null,
  ]
  const text = parts.filter(Boolean).join(', ')
  return text || null
}

/** "18:12" for a sync earlier today, "2 Nov" for an older one. */
export function formatSyncTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function garminSummary(
  status: GarminConnectionStatus | undefined,
  lastSyncedAt: string | null,
  now: Date = new Date(),
): RowValue | null {
  if (!status) return null
  if (status.needs_reauth) return { text: 'Reconnect needed', tone: 'warn' }
  if (!status.connected) return { text: 'Not connected' }
  if (!lastSyncedAt) return { text: 'Connected', tone: 'ok' }
  return { text: `Synced ${formatSyncTime(lastSyncedAt, now)}`, tone: 'ok' }
}

export function memorySummary(memories: CoachMemory[] | undefined): string | null {
  if (!memories) return null
  const active = memories.filter(m => m.active).length
  if (memories.length === 0) return 'None yet'
  return `${active} active`
}

export function notificationsSummary(prefs: NotificationPreferencesResponse | undefined): string | null {
  if (!prefs) return null
  const keys = Object.keys(prefs.labels)
  if (keys.length === 0) return null
  const on = keys.filter(k => prefs.categories[k] ?? true).length
  return `${on} of ${keys.length} on`
}

export function appearanceSummary(preference: ThemePreference): string {
  return preference.charAt(0).toUpperCase() + preference.slice(1)
}

export function healthSummary(health: SystemHealthResponse | undefined): RowValue | null {
  if (!health) return null
  if (!health.canary_ok) return { text: 'Schema drift', tone: 'warn' }
  const failed = health.recent_failed_jobs.length
  if (failed > 0) return { text: `${failed} failed job${failed === 1 ? '' : 's'}`, tone: 'warn' }
  return { text: 'All checks pass', tone: 'ok' }
}
