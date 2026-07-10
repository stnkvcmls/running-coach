import type { PersonalRecordResponse } from '../api/types'
import { toast } from '../components/ui/Toast'
import { parseISO } from './date'

const NEW_RECORD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const SEEN_KEY = 'runningCoach.celebratedRecordIds'

/** True when a record was achieved within the last 7 days of `now` (inclusive). */
export function isRecentRecord(achievedAt: string, now: Date = new Date()): boolean {
  const diffMs = now.getTime() - parseISO(achievedAt).getTime()
  return diffMs >= 0 && diffMs <= NEW_RECORD_WINDOW_MS
}

function loadSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function saveSeenIds(ids: Set<number>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]))
  } catch {
    // localStorage unavailable (private mode, quota) — celebration toast may repeat; non-critical
  }
}

/** Fire a one-time celebratory toast for each not-yet-seen record achieved in
 * the last 7 days. Called from surfaces that already load `personal_records`
 * (Today's activities, activity detail) so a new PB is celebrated on arrival. */
export function celebrateNewRecords(records: (PersonalRecordResponse | null | undefined)[] | null | undefined): void {
  const fresh = (records ?? []).filter((r): r is PersonalRecordResponse => !!r && isRecentRecord(r.achieved_at))
  if (fresh.length === 0) return

  const seen = loadSeenIds()
  let changed = false
  for (const r of fresh) {
    if (seen.has(r.id)) continue
    toast(`🏆 New ${r.label} best — ${r.display_value}`, { kind: 'success' })
    seen.add(r.id)
    changed = true
  }
  if (changed) saveSeenIds(seen)
}
