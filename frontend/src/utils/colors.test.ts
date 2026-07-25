import { describe, it, expect } from 'vitest'
import { getActivityColor, getColorHex, getActivityAccent, getActivityAccentHex, colorMap, SPORT_COLORS } from './colors'

describe('getActivityColor', () => {
  it('identifies interval workouts by name', () => {
    expect(getActivityColor('Interval Training', null)).toBe('interval')
    expect(getActivityColor('Speed Work', null)).toBe('interval')
    expect(getActivityColor('Track Repeats', null)).toBe('interval')
    expect(getActivityColor('Fartlek Run', null)).toBe('interval')
  })

  it('identifies tempo workouts by name', () => {
    expect(getActivityColor('Tempo Run', null)).toBe('tempo')
    expect(getActivityColor('Threshold Run', null)).toBe('tempo')
    expect(getActivityColor('Cruise Run', null)).toBe('tempo')
  })

  it('identifies long runs by name', () => {
    expect(getActivityColor('Long Run', null)).toBe('long')
    expect(getActivityColor('Sunday Long', null)).toBe('long')
  })

  it('identifies race activities by name', () => {
    expect(getActivityColor('5K Race', null)).toBe('race')
    expect(getActivityColor('Parkrun', null)).toBe('race')
    expect(getActivityColor('Competition', null)).toBe('race')
  })

  it('identifies easy runs by name', () => {
    expect(getActivityColor('Easy Run', null)).toBe('easy')
    expect(getActivityColor('Recovery Jog', null)).toBe('easy')
  })

  it('falls back to easy for running type', () => {
    expect(getActivityColor(null, 'running')).toBe('easy')
    expect(getActivityColor(null, 'run')).toBe('easy')
  })

  it('returns default for unrecognized activity', () => {
    expect(getActivityColor('Morning Workout', 'cycling')).toBe('default')
    expect(getActivityColor(null, null)).toBe('default')
  })

  it('is case-insensitive', () => {
    expect(getActivityColor('INTERVAL RUN', null)).toBe('interval')
    expect(getActivityColor('EASY JOG', null)).toBe('easy')
  })
})

describe('getColorHex', () => {
  it('returns a hex color string', () => {
    const hex = getColorHex('Easy Run', null)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns the correct color for easy runs', () => {
    expect(getColorHex('Easy Run', null)).toBe(colorMap.easy)
  })

  it('returns the correct color for intervals', () => {
    expect(getColorHex('Interval Session', null)).toBe(colorMap.interval)
  })

  it('returns the default color for unknown activities', () => {
    expect(getColorHex(null, null)).toBe(colorMap.default)
  })
})

describe('getActivityAccent', () => {
  it('keeps the workout-intensity tint for running activities', () => {
    expect(getActivityAccent('Interval Session', 'running')).toBe('var(--color-interval)')
    expect(getActivityAccent('Easy Run', 'running')).toBe('var(--color-easy)')
    expect(getActivityAccent(null, 'trail_running')).toBe('var(--color-easy)')
  })

  it('routes non-running sports through --sport-* tokens instead of the default purple', () => {
    expect(getActivityAccent('Morning Ride', 'cycling')).toBe('var(--sport-bike)')
    expect(getActivityAccent('Road Biking', 'road_biking')).toBe('var(--sport-bike)')
    expect(getActivityAccent('Pool Session', 'lap_swimming')).toBe('var(--sport-swim)')
    expect(getActivityAccent('Evening Walk', 'walking')).toBe('var(--sport-walk)')
    expect(getActivityAccent('Leg Day', 'strength_training')).toBe('var(--sport-strength)')
    expect(getActivityAccent(null, 'yoga')).toBe('var(--sport-other)')
  })

  it('tints a non-running activity by sport even when its name contains an intensity keyword', () => {
    // A "Tempo Ride" is still fundamentally a bike activity — sport wins over
    // a coincidental name match so the tint stays predictable per sport.
    expect(getActivityAccent('Tempo Ride', 'cycling')).toBe('var(--sport-bike)')
  })
})

describe('getActivityAccentHex', () => {
  it('returns the same literal hex getActivityAccent used to return, for canvas consumers', () => {
    expect(getActivityAccentHex('Interval Session', 'running')).toBe(colorMap.interval)
    expect(getActivityAccentHex('Morning Ride', 'cycling')).toBe(SPORT_COLORS.bike)
    expect(getActivityAccentHex(null, 'yoga')).toBe(SPORT_COLORS.other)
  })
})
