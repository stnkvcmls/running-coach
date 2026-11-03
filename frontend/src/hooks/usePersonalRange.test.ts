import { describe, it, expect } from 'vitest'
import type { DailySummaryResponse } from '../api/types'
import { buildPersonalRanges, computeRange, hrvVerdict, percentile, rangeVerdict } from './usePersonalRange'

function summary(date: string, overrides: Partial<DailySummaryResponse> = {}): DailySummaryResponse {
  return {
    id: 1, date, steps: null, total_calories: null, active_calories: null, resting_hr: null,
    max_hr: null, stress_avg: null, sleep_seconds: null, sleep_score: null, body_battery_high: null,
    body_battery_low: null, intensity_minutes: null, floors_climbed: null, hrv_avg: null,
    hrv_weekly_avg: null, hrv_status: null, ...overrides,
  }
}

function dayKey(offset: number): string {
  return new Date(Date.UTC(2026, 5, 1 + offset)).toISOString().slice(0, 10)
}

describe('percentile', () => {
  it('interpolates linearly', () => {
    const xs = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]
    expect(percentile(xs, 0.1)).toBe(20)
    expect(percentile(xs, 0.9)).toBe(100)
    expect(percentile([1, 2], 0.5)).toBe(1.5)
  })
})

describe('computeRange', () => {
  it('needs at least 14 samples', () => {
    expect(computeRange([1, 2, 3])).toBeNull()
  })

  it('returns the 10th–90th band', () => {
    const r = computeRange(Array.from({ length: 21 }, (_, i) => 40 + i))!
    expect(r.low).toBe(42)
    expect(r.high).toBe(58)
    expect(r.samples).toBe(21)
  })
})

describe('rangeVerdict', () => {
  const range = { low: 70, high: 85, samples: 30 }

  it('says in range without a night count', () => {
    expect(rangeVerdict([60, 75], range)).toMatchObject({ position: 'in', text: 'In your usual range', flag: false })
  })

  it('says below for a single night', () => {
    expect(rangeVerdict([75, 60], range)?.text).toBe('Below your range')
  })

  it('counts consecutive nights outside the band', () => {
    expect(rangeVerdict([75, 60, 62, 65], range)).toMatchObject({ nights: 3, text: 'Below your range for 3 nights', flag: true })
    expect(rangeVerdict([90, 91], range)?.text).toBe('Above your range for 2 nights')
  })
})

describe('hrvVerdict', () => {
  it('uses Garmin status text', () => {
    expect(hrvVerdict({ hrv_avg: 42, hrv_status: 'LOW' })).toMatchObject({ text: 'Low, per Garmin', flag: true })
    expect(hrvVerdict({ hrv_avg: 55, hrv_status: 'balanced' })).toMatchObject({ text: 'Balanced, per Garmin', flag: false })
  })

  it('falls back to the baseline band, then to nothing', () => {
    expect(hrvVerdict({ hrv_avg: 40, hrv_status: null, hrv_baseline_low: 45, hrv_baseline_high: 60 })?.position).toBe('below')
    expect(hrvVerdict({ hrv_avg: 40, hrv_status: null })).toBeNull()
  })
})

describe('buildPersonalRanges', () => {
  it('judges the day against the prior 90 days only', () => {
    const history = Array.from({ length: 30 }, (_, i) => summary(dayKey(i), { sleep_score: 70 + (i % 11) }))
    const target = dayKey(30)
    const all = [...history, summary(target, { sleep_score: 50 })]
    const { ranges, verdict } = buildPersonalRanges(all, target)
    expect(ranges.sleep_score).not.toBeNull()
    expect(ranges.resting_hr).toBeNull()
    expect(verdict('sleep_score', target)?.text).toBe('Below your range')
    expect(verdict('resting_hr', target)).toBeNull()
  })
})
