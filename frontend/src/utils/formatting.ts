export function formatPace(paceMinKm: number | null | undefined): string {
  if (!paceMinKm || paceMinKm <= 0) return '-'
  const mins = Math.floor(paceMinKm)
  const secs = Math.round((paceMinKm - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
