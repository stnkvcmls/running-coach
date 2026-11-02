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

/** Workout type → its effort-scale colour, as a `var(--color-*)` reference to
 * the tokens in globals.css (easy/long Z2, tempo Z4, interval/race Z5). */
export const colorMap: Record<ActivityColor, string> = {
  easy: 'var(--color-easy)',
  tempo: 'var(--color-tempo)',
  interval: 'var(--color-interval)',
  long: 'var(--color-long)',
  race: 'var(--color-race)',
  default: 'var(--color-default)',
}

export type Sport = 'run' | 'bike' | 'swim' | 'walk' | 'strength' | 'other'

/**
 * Per-sport series colour for charts and legends keyed on sport type. Sport
 * is a category, not an effort, so it is drawn in the neutral inks (running
 * in ink, cross-training in ink-2/ink-3) rather than a hue — colour stays
 * reserved for effort. Only three neutral steps exist, so the rarer sports
 * share a step; their labels (legend, tooltip) tell them apart.
 */
export const SPORT_COLORS: Record<Sport, string> = {
  run: 'var(--text)',
  bike: 'var(--text-muted)',
  swim: 'var(--text-faint)',
  walk: 'var(--text-faint)',
  strength: 'var(--text-muted)',
  other: 'var(--text-faint)',
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
 * Effort colour for an activity icon/dot/border. Running activities take the
 * workout-*intensity* colour (easy/tempo/interval/long/race via
 * `getActivityColor`); every other sport is cross-training, which sits at Z1
 * on the effort scale (`--color-cross`). The sport icon already tells a ride
 * from a swim.
 */
export function getActivityAccent(name: string | null, activityType: string | null): string {
  if (getSport(activityType) === 'run') return colorMap[getActivityColor(name, activityType)]
  return 'var(--color-cross)'
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

/** A translucent tint of a colour (which may be a `var()` reference), for a
 * soft background behind an effort-coloured mark. */
export function tint(color: string, percent = 14): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}
