import { describe, it, expect } from 'vitest'
import {
  getWeekDays,
  getMonthDays,
  formatDateKey,
  formatMonthKey,
  getWeekNumber,
  getTotalWeeksInYear,
} from './date'

describe('getWeekDays', () => {
  it('returns 7 days for any date', () => {
    const days = getWeekDays(new Date(2024, 0, 15)) // Monday Jan 15
    expect(days).toHaveLength(7)
  })

  it('starts the week on Monday', () => {
    // Jan 15 2024 is a Monday
    const days = getWeekDays(new Date(2024, 0, 15))
    expect(days[0].getDay()).toBe(1) // Monday = 1
  })

  it('ends the week on Sunday', () => {
    const days = getWeekDays(new Date(2024, 0, 15))
    expect(days[6].getDay()).toBe(0) // Sunday = 0
  })

  it('returns Monday through Sunday for a mid-week date', () => {
    // Jan 17 2024 is a Wednesday — week should still start on Jan 15 (Mon)
    const days = getWeekDays(new Date(2024, 0, 17))
    expect(days[0].getDate()).toBe(15)
    expect(days[6].getDate()).toBe(21)
  })
})

describe('getMonthDays', () => {
  it('returns 31 days for January', () => {
    const days = getMonthDays(new Date(2024, 0, 1))
    const nonNull = days.filter(Boolean)
    expect(nonNull).toHaveLength(31)
  })

  it('returns leading nulls for Monday-offset alignment', () => {
    // Jan 1 2024 is a Monday — no leading nulls needed
    const days = getMonthDays(new Date(2024, 0, 1))
    expect(days[0]).not.toBeNull()
  })

  it('returns leading nulls when month starts mid-week', () => {
    // Feb 1 2024 is a Thursday — 3 nulls (Mon=0, Tue=1, Wed=2)
    const days = getMonthDays(new Date(2024, 1, 1))
    expect(days[0]).toBeNull()
    expect(days[1]).toBeNull()
    expect(days[2]).toBeNull()
    expect(days[3]).not.toBeNull()
  })

  it('handles a Sunday start (6 leading nulls)', () => {
    // Sep 1 2024 is a Sunday — 6 leading nulls
    const days = getMonthDays(new Date(2024, 8, 1))
    const nullCount = days.filter((d) => d === null).length
    expect(nullCount).toBe(6)
  })
})

describe('formatDateKey', () => {
  it('formats date as yyyy-MM-dd', () => {
    expect(formatDateKey(new Date(2024, 0, 5))).toBe('2024-01-05')
  })

  it('pads single-digit month and day', () => {
    expect(formatDateKey(new Date(2024, 8, 9))).toBe('2024-09-09')
  })
})

describe('formatMonthKey', () => {
  it('formats date as yyyy-MM', () => {
    expect(formatMonthKey(new Date(2024, 0, 15))).toBe('2024-01')
  })

  it('pads single-digit month', () => {
    expect(formatMonthKey(new Date(2024, 8, 1))).toBe('2024-09')
  })
})

describe('getWeekNumber', () => {
  it('returns ISO week number', () => {
    // Jan 1 2024 is week 1
    expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1)
  })

  it('returns correct week for mid-year date', () => {
    // July 1 2024 is ISO week 27
    expect(getWeekNumber(new Date(2024, 6, 1))).toBe(27)
  })
})

describe('getTotalWeeksInYear', () => {
  it('returns 52 for a regular year', () => {
    expect(getTotalWeeksInYear(2023)).toBe(52)
  })

  it('returns 53 for a long year', () => {
    // 2020 has 53 ISO weeks
    expect(getTotalWeeksInYear(2020)).toBe(53)
  })
})
