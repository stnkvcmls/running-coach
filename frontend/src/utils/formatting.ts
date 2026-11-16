/** `m:ss` for a pace in min/km. Unguarded: 0 renders as `0:00` (axis ticks). */
export function paceClock(paceMinKm: number): string {
  let mins = Math.floor(paceMinKm)
  let secs = Math.round((paceMinKm - mins) * 60)
  if (secs === 60) {
    // 4.999 min/km is 5:00, not 4:60.
    mins += 1
    secs = 0
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatPace(paceMinKm: number | null | undefined): string {
  if (!paceMinKm || paceMinKm <= 0) return '-'
  return paceClock(paceMinKm)
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '-'
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function formatDistance(meters: number | null | undefined): string {
  if (!meters) return '-'
  const km = meters / 1000
  if (km >= 10) return km.toFixed(1)
  return km.toFixed(2)
}

export function formatSleepHours(seconds: number | null | undefined): string {
  if (!seconds) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}
