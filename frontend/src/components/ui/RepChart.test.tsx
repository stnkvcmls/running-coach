import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RepChart, { repsFromAdherence } from './RepChart'
import type { IntervalAdherence, WorkoutAdherence } from '../../api/types'

function iv(step_type: string, actual: string | null, planned: string | null, matched = true): IntervalAdherence {
  return {
    step_order: 1, label: '', step_type, planned_distance_m: null, actual_distance_m: null,
    planned_pace_display: planned, actual_pace_display: actual, pace_delta_sec_per_km: null,
    distance_delta_m: null, matched, interval_score: null,
  }
}

function adherence(intervals: IntervalAdherence[] | null): WorkoutAdherence {
  return {
    planned_distance_m: null, planned_rest_distance_m: null, actual_distance_m: null, actual_rest_distance_m: null,
    distance_pct: null, planned_pace_display: null, actual_pace_display: null, pace_delta_sec_per_km: null,
    planned_intervals: null, actual_laps: null, adherence_score: 90, summary: '', intervals,
  }
}

describe('repsFromAdherence', () => {
  it('keeps matched work reps only, with the target at the middle of the range', () => {
    const reps = repsFromAdherence(adherence([
      iv('warmup', '5:30/km', null),
      iv('interval', '4:02/km', '3:55 - 4:05/km'),
      iv('rest', null, null),
      iv('interval', '3:58/km', '3:55 - 4:05/km'),
      iv('interval', null, '3:55 - 4:05/km', false),
    ]))
    expect(reps).toEqual([{ paceSec: 242, targetSec: 240 }, { paceSec: 238, targetSec: 240 }])
  })

  it('is empty without a breakdown', () => {
    expect(repsFromAdherence(adherence(null))).toEqual([])
    expect(repsFromAdherence(null)).toEqual([])
  })
})

describe('RepChart', () => {
  it('draws a taller bar for a faster rep, labels paces and the target', () => {
    const { container } = render(
      <RepChart color="var(--z5)" reps={[{ paceSec: 245, targetSec: 240 }, { paceSec: 238, targetSec: 240 }]} />,
    )
    expect(screen.getByRole('img', { name: 'Rep paces against a 4:00 target: 4:05, 3:58' })).toBeInTheDocument()
    expect(screen.getByText('Target 4:00')).toBeInTheDocument()
    const bars = container.querySelectorAll<HTMLElement>('.rep-chart-bar')
    expect(parseFloat(bars[1].style.height)).toBeGreaterThan(parseFloat(bars[0].style.height))
  })

  it('renders nothing for fewer than two reps', () => {
    const { container } = render(<RepChart color="var(--z5)" reps={[{ paceSec: 240, targetSec: null }]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
