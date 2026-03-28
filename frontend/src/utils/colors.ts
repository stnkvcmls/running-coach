export type ActivityColor = 'easy' | 'tempo' | 'interval' | 'long' | 'race' | 'default'

export function getActivityColor(name: string | null, activityType: string | null): ActivityColor {
  const n = (name || '').toLowerCase()
  const t = (activityType || '').toLowerCase()

  if (n.includes('interval') || n.includes('speed') || n.includes('track') || n.includes('fartlek') || n.includes('repeat')) return 'interval'
  if (n.includes('tempo') || n.includes('threshold') || n.includes('cruise')) return 'tempo'
  if (n.includes('long') || n.includes('long run')) return 'long'
  if (n.includes('race') || n.includes('competition') || n.includes('parkrun')) return 'race'
  if (n.includes('easy') || n.includes('recovery') || n.includes('jog')) return 'easy'

  // Fallback based on type
  if (t.includes('running') || t === 'run') return 'easy'
  return 'default'
}

export const colorMap: Record<ActivityColor, string> = {
  easy: '#2ecc71',
  tempo: '#f39c12',
  interval: '#e74c3c',
  long: '#0984e3',
  race: '#e84393',
  default: '#6c5ce7',
}

export function getColorHex(name: string | null, activityType: string | null): string {
  return colorMap[getActivityColor(name, activityType)]
}
