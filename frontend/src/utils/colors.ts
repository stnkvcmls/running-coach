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

/** `--sport-*` counterpart to `SPORT_COLORS`, for TSX that renders the accent
 * via inline `style` (`WORKOUT_TYPE_COLORS`'s sibling for non-running sports).
 * Skin-scoped like every other token so nothing-signal can monochrome it. */
const SPORT_COLOR_VARS: Record<Exclude<Sport, 'run'>, string> = {
  bike: 'var(--sport-bike)',
  swim: 'var(--sport-swim)',
  walk: 'var(--sport-walk)',
  strength: 'var(--sport-strength)',
  other: 'var(--sport-other)',
}

/**
 * Accent colour for an activity icon/dot/border. Running activities keep the
 * workout-*intensity* tint (easy/tempo/interval/long/race via
 * `getActivityColor`) since it encodes more information than a flat "run"
 * colour would — the sport icon already disambiguates running from
 * everything else. Every other sport is tinted by its `SPORT_COLOR_VARS`
 * entry instead of falling through to the generic `default` purple.
 *
 * Returns a `var(--…)` reference, not a literal hex, so the accent can be
 * skinned (see nothing.css) — callers use it in inline `style`, where a CSS
 * variable resolves like any other colour. `colorMap`/`SPORT_COLORS` (the
 * literal-hex tables) stay separate for the two things that truly need a raw
 * hex string: Recharts props (`chartTheme.ts`) and this file's own tests.
 */
export function getActivityAccent(name: string | null, activityType: string | null): string {
  const sport = getSport(activityType)
  if (sport === 'run') return WORKOUT_TYPE_COLORS[getActivityColor(name, activityType)]
  return SPORT_COLOR_VARS[sport]
}

/**
 * Literal-hex twin of `getActivityAccent`, for the one consumer that draws to
 * a `<canvas>` instead of CSS — `RouteMap.tsx` can't resolve `var()` there
 * (see its own skin-aware `getComputedStyle` workaround) and needs an actual
 * colour string.
 */
export function getActivityAccentHex(name: string | null, activityType: string | null): string {
  const sport = getSport(activityType)
  if (sport === 'run') return colorMap[getActivityColor(name, activityType)]
  return SPORT_COLORS[sport]
}
