import { useMemo } from 'react'
import { useWellnessTrends } from '../api/hooks'
import type { DailySummaryResponse } from '../api/types'

/**
 * "Every number has a reference" (docs/UI_UX_CRITIQUE.md §5.1, §8 Q3):
 * resting HR, sleep score, body battery and stress are compared with the
 * athlete's own 10th–90th percentile over the last 90 days; HRV uses
 * Garmin's own status and baseline so the app never contradicts the watch.
 */

export type RangeMetric = 'resting_hr' | 'sleep_score' | 'body_battery_high' | 'stress_avg'

export const RANGE_METRICS: RangeMetric[] = ['resting_hr', 'sleep_score', 'body_battery_high', 'stress_avg']

export interface PersonalRange {
  low: number
  high: number
  /** Days the band was computed from. */
  samples: number
}

export type RangePosition = 'in' | 'below' | 'above'

export interface RangeVerdict {
  position: RangePosition | null
  /** Consecutive days (ending on the evaluated one) in the same position. */
  nights: number
  text: string
  /** True when the value sits outside the athlete's usual (or Garmin's) band. */
  flag: boolean
}

/** Fewer days than this and a percentile band means little. */
export const MIN_SAMPLES = 14
const WINDOW_DAYS = 90

/** Linear-interpolated percentile of an ascending array (p in 0–1). */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** 10th–90th percentile band, or null below MIN_SAMPLES values. */
export function computeRange(values: number[]): PersonalRange | null {
  const clean = values.filter(v => Number.isFinite(v)).sort((a, b) => a - b)
  if (clean.length < MIN_SAMPLES) return null
  return { low: percentile(clean, 0.1), high: percentile(clean, 0.9), samples: clean.length }
}

export function positionIn(value: number, range: PersonalRange): RangePosition {
  if (value < range.low) return 'below'
  if (value > range.high) return 'above'
  return 'in'
}

const POSITION_TEXT: Record<RangePosition, string> = {
  in: 'In your usual range',
  below: 'Below your range',
  above: 'Above your range',
}

/**
 * Verdict for the last value of `series` (ascending by date, one value per
 * night). "for N nights" is appended when the value has been outside the band
 * for 2 or more consecutive nights.
 */
export function rangeVerdict(series: number[], range: PersonalRange): RangeVerdict | null {
  if (series.length === 0) return null
  const position = positionIn(series[series.length - 1], range)
  let nights = 0
  for (let i = series.length - 1; i >= 0 && positionIn(series[i], range) === position; i--) nights++
  const suffix = position !== 'in' && nights >= 2 ? ` for ${nights} nights` : ''
  return { position, nights, text: POSITION_TEXT[position] + suffix, flag: position !== 'in' }
}

const HRV_STATUS_TEXT: Record<string, string> = {
  BALANCED: 'Balanced, per Garmin',
  UNBALANCED: 'Unbalanced, per Garmin',
  LOW: 'Low, per Garmin',
  POOR: 'Poor, per Garmin',
}

/** HRV verdict from Garmin's status; when the status is missing but the
 * baseline is there, place the value against Garmin's balanced range. */
export function hrvVerdict(summary: Pick<DailySummaryResponse, 'hrv_avg' | 'hrv_status' | 'hrv_baseline_low' | 'hrv_baseline_high'>): RangeVerdict | null {
  const status = summary.hrv_status?.toUpperCase().trim()
  if (status && HRV_STATUS_TEXT[status]) {
    return { position: null, nights: 1, text: HRV_STATUS_TEXT[status], flag: status !== 'BALANCED' }
  }
  const band = hrvBand(summary)
  if (band && summary.hrv_avg != null) {
    const position = positionIn(summary.hrv_avg, band)
    const text = position === 'in' ? 'In Garmin’s balanced range' : position === 'below' ? 'Below Garmin’s range' : 'Above Garmin’s range'
    return { position, nights: 1, text, flag: position !== 'in' }
  }
  return null
}

export function hrvBand(summary: Pick<DailySummaryResponse, 'hrv_baseline_low' | 'hrv_baseline_high'>): PersonalRange | null {
  const { hrv_baseline_low: low, hrv_baseline_high: high } = summary
  return low != null && high != null ? { low, high, samples: 0 } : null
}

export interface PersonalRanges {
  ranges: Record<RangeMetric, PersonalRange | null>
  /** Verdict for `metric` on `date` (the day's value vs the band). */
  verdict: (metric: RangeMetric, date: string, value?: number | null) => RangeVerdict | null
}

/**
 * Pure core of usePersonalRange. The band uses the 90 days *before* `date`
 * (so today's own value never shifts the reference it's judged against);
 * the consecutive-night count walks back through those days.
 */
export function buildPersonalRanges(summaries: DailySummaryResponse[], date: string): PersonalRanges {
  const start = shiftKey(date, -WINDOW_DAYS)
  const prior = summaries
    .filter(s => s.date < date && s.date >= start)
    .sort((a, b) => a.date.localeCompare(b.date))

  const ranges = Object.fromEntries(
    RANGE_METRICS.map(m => [m, computeRange(prior.map(s => s[m]).filter((v): v is number => v != null))]),
  ) as Record<RangeMetric, PersonalRange | null>

  const verdict = (metric: RangeMetric, day: string, value?: number | null) => {
    const range = ranges[metric]
    if (!range) return null
    const own = value ?? summaries.find(s => s.date === day)?.[metric] ?? null
    if (own == null) return null
    const history = prior.filter(s => s.date < day).map(s => s[metric]).filter((v): v is number => v != null)
    return rangeVerdict([...history, own], range)
  }

  return { ranges, verdict }
}

function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** Personal 10th–90th percentile bands for the body metrics, from the last
 * 90 days of daily summaries. Shared by Today's Body panel and Progress. */
export function usePersonalRange(date: string): PersonalRanges & { isLoading: boolean } {
  const { data, isLoading } = useWellnessTrends(WINDOW_DAYS)
  const result = useMemo(() => buildPersonalRanges(Array.isArray(data) ? data : [], date), [data, date])
  return { ...result, isLoading }
}
