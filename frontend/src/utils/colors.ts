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

export type Sport = 'run' | 'bike' | 'swim' | 'walk' | 'strength' | 'other'

/** Canonical per-sport colour, shared by every chart/legend keyed on sport type. */
export const SPORT_COLORS: Record<Sport, string> = {
  run: '#6c5ce7',
  bike: '#00b894',
  swim: '#0984e3',
  walk: '#fdcb6e',
  strength: '#a29bfe',
  other: '#b2bec3',
}

function getSport(activityType: string | null): Sport {
  const t = (activityType || '').toLowerCase()
  if (t.includes('run')) return 'run'
  if (t.includes('cycling') || t.includes('biking') || t.includes('bik')) return 'bike'
  if (t.includes('swim')) return 'swim'
  if (t.includes('walk') || t.includes('hik')) return 'walk'
  if (t.includes('strength') || t.includes('weight')) return 'strength'
  return 'other'
}

/**
 * Accent colour for an activity icon/dot/border. Running activities keep the
 * workout-*intensity* tint (easy/tempo/interval/long/race via
 * `getActivityColor`) since it encodes more information than a flat "run"
 * colour would — the sport icon already disambiguates running from
 * everything else. Every other sport is tinted by its `SPORT_COLORS` entry
 * instead of falling through to the generic `default` purple.
 */
export function getActivityAccent(name: string | null, activityType: string | null): string {
  const sport = getSport(activityType)
  if (sport === 'run') return colorMap[getActivityColor(name, activityType)]
  return SPORT_COLORS[sport]
}

/** Re-export of the `--color-*` workout-type palette in globals.css, for TSX that needs the value as data rather than a CSS rule. */
export const WORKOUT_TYPE_COLORS: Record<string, string> = {
  easy: 'var(--color-easy)',
  tempo: 'var(--color-tempo)',
  interval: 'var(--color-interval)',
  long: 'var(--color-long)',
  race: 'var(--color-race)',
  cross: 'var(--color-cross)',
  strength: 'var(--color-strength)',
  default: 'var(--color-default)',
}
