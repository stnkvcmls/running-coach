import type { ChartSeries, IntervalAdherence, WorkoutAdherence } from '../../api/types'

/** A workout step's stretch of the run, in km from the start. */
export interface StepWindow {
  startKm: number
  endKm: number
  stepType: string
}

/**
 * Where each workout step sits along the run, from the per-step adherence
 * breakdown: steps are laps in order, so their actual distances add up. Null
 * when any step was not matched to a lap (the positions would drift).
 */
export function stepWindows(adherence: WorkoutAdherence | null | undefined): StepWindow[] | null {
  const steps = adherence?.intervals
  if (!steps || steps.length === 0) return null
  if (steps.some(s => !s.matched || s.actual_distance_m == null)) return null
  let km = 0
  return steps.map(s => {
    const startKm = km
    km += s.actual_distance_m! / 1000
    return { startKm, endKm: km, stepType: s.step_type }
  })
}

/**
 * Distance from the start (km) for each chart sample. Uses a `distance`
 * series when the API provides one; otherwise integrates the pace series
 * (samples are evenly spaced in time) and scales it to the activity's total
 * distance. Null when neither is possible.
 */
export function sampleDistancesKm(
  chartData: Record<string, ChartSeries> | null | undefined,
  totalDistanceM: number | null | undefined,
): number[] | null {
  if (!chartData) return null
  const direct = chartData.distance?.data
  if (direct && direct.some(v => v != null)) {
    const toKm = chartData.distance.unit === 'km' ? 1 : 1 / 1000
    let last = 0
    return direct.map(v => (last = v != null ? v * toKm : last))
  }
  const pace = chartData.pace?.data
  if (!pace || pace.length < 2 || !totalDistanceM || totalDistanceM <= 0) return null
  // Speed in km per sample interval, up to a constant factor (1 / pace).
  const cumulative: number[] = [0]
  for (let i = 1; i < pace.length; i++) {
    const p = pace[i]
    cumulative.push(cumulative[i - 1] + (p != null && p > 0 ? 1 / p : 0))
  }
  const end = cumulative[cumulative.length - 1]
  if (end <= 0) return null
  const scale = totalDistanceM / 1000 / end
  return cumulative.map(c => c * scale)
}

/** Highest value of `series` inside [startKm, endKm]. */
export function peakIn(
  series: (number | null)[],
  distKm: number[],
  window: { startKm: number; endKm: number },
): number | null {
  let peak: number | null = null
  for (let i = 0; i < series.length && i < distKm.length; i++) {
    const v = series[i]
    if (v == null || distKm[i] < window.startKm || distKm[i] > window.endKm) continue
    if (peak == null || v > peak) peak = v
  }
  return peak != null ? Math.round(peak) : null
}

function formatStepDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  const km = Math.round(m / 10) / 100
  return `${km} km`
}

/** "6 × 800 m": the work-rep count, with the rep distance when every rep has
 * the same planned distance. */
export function repStructureLabel(intervals: IntervalAdherence[]): string {
  const reps = intervals.filter(iv => iv.step_type === 'interval')
  const distances = new Set(reps.map(iv => iv.planned_distance_m))
  const [only] = [...distances]
  return distances.size === 1 && only != null
    ? `${reps.length} × ${formatStepDistance(only)}`
    : `${reps.length} reps`
}
