import { describe, it, expect } from 'vitest'
import { formatPace, formatDuration, formatDistance, formatSleepHours } from './formatting'

describe('formatPace', () => {
  it('returns dash for null', () => {
    expect(formatPace(null)).toBe('-')
  })

  it('returns dash for undefined', () => {
    expect(formatPace(undefined)).toBe('-')
  })

  it('returns dash for zero', () => {
    expect(formatPace(0)).toBe('-')
  })

  it('returns dash for negative value', () => {
    expect(formatPace(-1)).toBe('-')
  })

  it('formats whole minutes', () => {
    expect(formatPace(5)).toBe('5:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatPace(5.5)).toBe('5:30')
  })

  it('pads single-digit seconds', () => {
    expect(formatPace(4.1)).toBe('4:06')
  })
})

describe('formatDuration', () => {
  it('returns dash for null', () => {
    expect(formatDuration(null)).toBe('-')
  })

  it('returns dash for zero', () => {
    expect(formatDuration(0)).toBe('-')
  })

  it('formats minutes and seconds without hour', () => {
    expect(formatDuration(90)).toBe('1:30')
  })

  it('formats hours minutes seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('pads minutes and seconds with leading zeros', () => {
    expect(formatDuration(3600)).toBe('1:00:00')
  })

  it('formats sub-minute durations', () => {
    expect(formatDuration(45)).toBe('0:45')
  })
})

describe('formatDistance', () => {
  it('returns dash for null', () => {
    expect(formatDistance(null)).toBe('-')
  })

  it('returns dash for zero', () => {
    expect(formatDistance(0)).toBe('-')
  })

  it('shows two decimal places for distances under 10 km', () => {
    expect(formatDistance(5000)).toBe('5.00')
  })

  it('shows one decimal place for distances 10 km and over', () => {
    expect(formatDistance(21097)).toBe('21.1')
  })

  it('formats a 42.2 km marathon', () => {
    expect(formatDistance(42195)).toBe('42.2')
  })
})

describe('formatSleepHours', () => {
  it('returns dash for null', () => {
    expect(formatSleepHours(null)).toBe('-')
  })

  it('returns dash for zero', () => {
    expect(formatSleepHours(0)).toBe('-')
  })

  it('formats hours and minutes', () => {
    expect(formatSleepHours(7 * 3600 + 30 * 60)).toBe('7h 30m')
  })

  it('formats exact hours with zero minutes', () => {
    expect(formatSleepHours(8 * 3600)).toBe('8h 0m')
  })
})
