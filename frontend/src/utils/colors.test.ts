import { describe, it, expect } from 'vitest'
import { getActivityColor, getColorHex, colorMap } from './colors'

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
