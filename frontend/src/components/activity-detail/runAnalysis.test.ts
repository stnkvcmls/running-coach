import { describe, it, expect } from 'vitest'
import type { IntervalAdherence, WorkoutAdherence } from '../../api/types'
import { peakIn, repStructureLabel, sampleDistancesKm, stepWindows } from './runAnalysis'
import { heartRateDomain, kmTicks } from './ChartTabs'

function step(step_type: string, distance: number | null, matched = true): IntervalAdherence {
  return {
    step_order: 1, label: '', step_type, planned_distance_m: distance, actual_distance_m: distance,
    planned_pace_display: null, actual_pace_display: null, pace_delta_sec_per_km: null,
    distance_delta_m: null, matched, interval_score: null,
  }
}

function adherence(intervals: IntervalAdherence[]): WorkoutAdherence {
  return {
    planned_distance_m: null, planned_rest_distance_m: null, actual_distance_m: null, actual_rest_distance_m: null,
    distance_pct: null, planned_pace_display: null, actual_pace_display: null, pace_delta_sec_per_km: null,
    planned_intervals: null, actual_laps: null, adherence_score: 90, summary: '', intervals,
  }
}

describe('stepWindows', () => {
  it('lays the steps end to end along the run', () => {
    const windows = stepWindows(adherence([step('warmup', 1500), step('interval', 800), step('rest', 400)]))!
    expect(windows.map(w => [w.stepType, +w.startKm.toFixed(3), +w.endKm.toFixed(3)])).toEqual([
      ['warmup', 0, 1.5],
      ['interval', 1.5, 2.3],
      ['rest', 2.3, 2.7],
    ])
  })

  it('gives up when a step was not matched to a lap', () => {
    expect(stepWindows(adherence([step('warmup', 1500), step('interval', null, false)]))).toBeNull()
    expect(stepWindows(null)).toBeNull()
  })
})

describe('sampleDistancesKm', () => {
  it('integrates pace into distance, scaled to the activity total', () => {
    // Twice as fast in the second half → twice the distance per sample.
    const d = sampleDistancesKm({ pace: { label: 'Pace', unit: 'min/km', data: [6, 6, 6, 3, 3] } }, 6000)!
    expect(d.map(v => +v.toFixed(2))).toEqual([0, 1, 2, 4, 6])
  })

  it('prefers a distance stream when there is one', () => {
    expect(sampleDistancesKm({ distance: { label: 'Distance', unit: 'm', data: [0, 500, null, 1500] } }, 1500))
      .toEqual([0, 0.5, 0.5, 1.5])
  })

  it('is null without pace or total distance', () => {
    expect(sampleDistancesKm({ heart_rate: { label: 'HR', unit: 'bpm', data: [140, 150] } }, 5000)).toBeNull()
    expect(sampleDistancesKm({ pace: { label: 'Pace', unit: 'min/km', data: [5, 5] } }, null)).toBeNull()
  })
})

describe('peakIn', () => {
  it('returns the highest value inside the window', () => {
    expect(peakIn([140, 165, 150, 170], [0, 1, 2, 3], { startKm: 0.5, endKm: 2.5 })).toBe(165)
    expect(peakIn([140, null], [0, 1], { startKm: 0.5, endKm: 1.5 })).toBeNull()
  })
})

describe('repStructureLabel', () => {
  it('names the rep count and distance when every rep is the same', () => {
    expect(repStructureLabel([step('warmup', 1500), step('interval', 800), step('rest', 400), step('interval', 800)])).toBe('2 × 800 m')
    expect(repStructureLabel([step('interval', 1600), step('interval', 1600)])).toBe('2 × 1.6 km')
    expect(repStructureLabel([step('interval', 400), step('interval', 800)])).toBe('2 reps')
  })
})

describe('ChartTabs axes', () => {
  it('floors heart rate about 10 bpm under the lowest beat instead of zooming in', () => {
    expect(heartRateDomain([161, 170])).toEqual([150, 180])
    expect(heartRateDomain([118, 169])).toEqual([100, 180])
  })

  it('puts whole-km ticks along the distance axis', () => {
    expect(kmTicks(9.2)).toEqual([0, 2, 4, 6, 8])
    expect(kmTicks(5.4)).toEqual([0, 1, 2, 3, 4, 5])
  })
})
