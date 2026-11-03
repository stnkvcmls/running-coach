import { describe, it, expect } from 'vitest'
import { getActivityColor, getActivityAccent, colorMap, SPORT_COLORS } from './colors'

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
describe('colorMap', () => {
  it('points every workout type at its effort-scale token', () => {
    expect(colorMap.easy).toBe('var(--color-easy)')
    expect(colorMap.interval).toBe('var(--color-interval)')
    expect(colorMap.default).toBe('var(--color-default)')
  })
})

describe('getActivityAccent', () => {
  it('keeps the workout-intensity colour for running activities', () => {
    expect(getActivityAccent('Interval Session', 'running')).toBe(colorMap.interval)
    expect(getActivityAccent('Easy Run', 'running')).toBe(colorMap.easy)
    expect(getActivityAccent(null, 'trail_running')).toBe(colorMap.easy)
  })

  it('puts every non-running sport at the cross-training step (Z1) instead of the default', () => {
    for (const type of ['cycling', 'road_biking', 'lap_swimming', 'walking', 'strength_training', 'yoga']) {
      expect(getActivityAccent('Session', type)).toBe('var(--color-cross)')
    }
  })

  it('colours a non-running activity as cross-training even when its name contains an intensity keyword', () => {
    // A "Tempo Ride" is still fundamentally a bike activity — sport wins over
    // a coincidental name match so the colour stays predictable per sport.
    expect(getActivityAccent('Tempo Ride', 'cycling')).toBe('var(--color-cross)')
  })
})

describe('SPORT_COLORS', () => {
  it('draws sports in neutral inks, never an effort colour', () => {
    for (const color of Object.values(SPORT_COLORS)) {
      expect(color).toMatch(/^var\(--text(-muted|-faint)?\)$/)
    }
  })
})
