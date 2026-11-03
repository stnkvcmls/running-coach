import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ActivityDetailView from './ActivityDetailView'
import type { ActivityDetail, IntervalAdherence, WorkoutAdherence } from '../../api/types'

function activityDetail(overrides: Partial<ActivityDetail> = {}): ActivityDetail {
  return {
    id: 1,
    garmin_id: null,
    activity_type: 'running',
    name: 'Tempo Run',
    started_at: '2026-07-08T07:12:00Z',
    duration_sec: 3492,
    distance_m: 12400,
    avg_hr: 152,
    max_hr: 171,
    avg_pace_min_km: 4.68,
    calories: 748,
    elevation_gain: 84,
    elevation_loss: null,
    max_elevation: null,
    min_elevation: null,
    avg_cadence: null,
    max_cadence: null,
    avg_stride: null,
    training_effect_aerobic: null,
    training_effect_anaerobic: null,
    vo2max: null,
    avg_power: null,
    normalized_power: null,
    training_stress_score: null,
    intensity_factor: null,
    avg_ground_contact_time: null,
    avg_vertical_oscillation: null,
    avg_vertical_ratio: null,
    avg_speed: null,
    max_speed: null,
    min_hr: null,
    avg_respiration_rate: null,
    max_respiration_rate: null,
    run_time_sec: null,
    walk_time_sec: null,
    decoupling_pct: null,
    efficiency_factor: null,
    weather_adjusted_pace_min_km: null,
    weather_penalty_sec_per_km: null,
    weather_description: null,
    splits: null,
    hr_zones: null,
    weather: null,
    power_zones: null,
    chart_data: null,
    route: null,
    metric_zones: null,
    feedback_rating: null,
    feedback_tags: null,
    feedback_text: null,
    rpe: null,
    insight: null,
    scheduled_workout: null,
    adherence: null,
    personal_records: null,
    workout_tag: null,
    ...overrides,
  }
}

function mockFetch(activity: ActivityDetail) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('/activities/')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => activity })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
  })
}

function renderDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/activities/1']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ActivityDetailView sticky header', () => {
  let ioCallback: IntersectionObserverCallback | null = null

  class MockIntersectionObserver {
    constructor(cb: IntersectionObserverCallback) {
      ioCallback = cb
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    ioCallback = null
  })

  it('is absent until the full header scrolls out of view, then appears via the IntersectionObserver callback', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail()))
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    const { container } = renderDetail()

    expect(await screen.findByRole('heading', { name: 'Tempo Run' })).toBeInTheDocument()
    expect(container.querySelector('.sticky-detail-header')).not.toBeInTheDocument()
    expect(ioCallback).not.toBeNull()

    act(() => {
      ioCallback!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    })

    expect(container.querySelector('.sticky-detail-header')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Tempo Run' }).length).toBeGreaterThan(0)
  })

  it('hides again once the header scrolls back into view', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail()))
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    const { container } = renderDetail()
    await screen.findByRole('heading', { name: 'Tempo Run' })

    act(() => {
      ioCallback!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    expect(container.querySelector('.sticky-detail-header')).toBeInTheDocument()

    act(() => {
      ioCallback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })
    expect(container.querySelector('.sticky-detail-header')).not.toBeInTheDocument()
  })
})

const insight = {
  id: 1,
  created_at: null,
  trigger_type: 'activity',
  trigger_id: 1,
  content: 'Strong tempo effort. HR drifted only 3% in the second half.',
  summary: null,
  category: null,
}

describe('ActivityDetailView headline and coach verdict', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('leads with distance, time and pace, then one verdict sentence', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({ insight })))
    const { container } = renderDetail()

    await screen.findByRole('heading', { name: 'Tempo Run' })
    const figs = container.querySelector('.headline-figs') as HTMLElement
    expect(within(figs).getByText('Distance')).toBeInTheDocument()
    expect(figs).toHaveTextContent('12.4km')
    expect(figs).toHaveTextContent('58:12')
    expect(figs).toHaveTextContent('4:41/km')
    expect(screen.getByText(/Strong tempo effort\./)).toBeInTheDocument()
    expect(screen.queryByText(/HR drifted only 3%/)).not.toBeInTheDocument()
  })

  it('expands the full analysis in place, with Re-analyze, and has no second insight card', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({ insight })))
    renderDetail()

    const toggle = await screen.findByRole('button', { name: 'Full analysis' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: 'Hide analysis' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/HR drifted only 3%/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Re-analyze' })).toBeInTheDocument()
    expect(screen.queryByText('Workout insights')).not.toBeInTheDocument()
  })

  it('omits the verdict when there is no insight yet, and asks for a rating instead', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail()))
    renderDetail()

    await screen.findByRole('heading', { name: 'Tempo Run' })
    expect(screen.queryByRole('button', { name: /Full analysis/ })).not.toBeInTheDocument()
    expect(screen.getByText('How did you find this workout?')).toBeInTheDocument()
  })

  it('says the analysis is being written once rated', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({ feedback_rating: 'good' })))
    renderDetail()

    expect(await screen.findByText('Generating insights...')).toBeInTheDocument()
    expect(screen.queryByText('How did you find this workout?')).not.toBeInTheDocument()
  })

  it('lists RPE as Effort under More stats', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({ rpe: 7 })))
    renderDetail()

    await screen.findByText('More stats')
    const effort = screen.getByText('Effort').closest('.stat-cell') as HTMLElement
    expect(effort).toHaveTextContent('7of 10')
  })
})

function step(step_order: number, step_type: string, distance: number, actualPace: string | null, plannedPace: string | null): IntervalAdherence {
  return {
    step_order, label: `${step_type} ${step_order}`, step_type,
    planned_distance_m: distance, actual_distance_m: distance,
    planned_pace_display: plannedPace, actual_pace_display: actualPace,
    pace_delta_sec_per_km: null, distance_delta_m: 0, matched: true, interval_score: null,
  }
}

function intervalAdherence(): WorkoutAdherence {
  return {
    planned_distance_m: 2400, planned_rest_distance_m: 800, actual_distance_m: 2400, actual_rest_distance_m: 800,
    distance_pct: 100, planned_pace_display: '4:00/km', actual_pace_display: '4:00/km', pace_delta_sec_per_km: 0,
    planned_intervals: 3, actual_laps: 7, adherence_score: 96, summary: 'All three reps on target.',
    intervals: [
      step(1, 'warmup', 1600, '5:30/km', null),
      step(2, 'interval', 800, '4:02/km', '3:55 - 4:05/km'),
      step(3, 'rest', 400, '6:30/km', null),
      step(4, 'interval', 800, '3:58/km', '3:55 - 4:05/km'),
      step(5, 'rest', 400, '6:30/km', null),
      step(6, 'interval', 800, '4:00/km', '3:55 - 4:05/km'),
      step(7, 'cooldown', 1000, '5:40/km', null),
    ],
  }
}

describe('ActivityDetailView reps (structured session)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 59 evenly paced samples over 5.8 km: sample i sits at i × 0.1 km. One HR
  // spike in the middle of each rep (2.0, 3.2, 4.4 km).
  const hr = Array.from({ length: 59 }, (_, i) => (i === 20 ? 165 : i === 32 ? 166 : i === 44 ? 168 : 140))
  const structured = activityDetail({
    name: 'Interval Run',
    distance_m: 5800,
    adherence: intervalAdherence(),
    splits: [{ distance: 1000, duration: 300 }, { distance: 1000, duration: 300 }, { distance: 1000, duration: 300 }],
    scheduled_workout: {
      workout_steps: [{ step_type: 'interval', duration_type: 'distance', duration_value: 800 }],
    } as unknown as ActivityDetail['scheduled_workout'],
    chart_data: {
      heart_rate: { label: 'Heart Rate', unit: 'bpm', data: hr },
      pace: { label: 'Pace', unit: 'min/km', data: Array(59).fill(5) },
    },
  })

  it('shows a Reps panel with the structure, target, adherence and peak HR per rep', async () => {
    vi.stubGlobal('fetch', mockFetch(structured))
    const { container } = renderDetail()

    await screen.findByText('Reps')
    expect(screen.getByText('3 × 800 m, target 4:00 /km, 96% adherence')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Rep paces against a 4:00 target: 4:02, 3:58, 4:00' })).toBeInTheDocument()
    const peaks = [...container.querySelectorAll('.rep-chart-labels small')].map(n => n.textContent)
    expect(peaks).toEqual(['165', '166', '168'])

    // Splits give way to the rep chart; the bare structure bar is gone (D1).
    expect(screen.queryByText('Splits')).not.toBeInTheDocument()
    expect(screen.queryByText('Description')).not.toBeInTheDocument()
  })

  it('reveals the lap-by-lap adherence table behind "All laps"', async () => {
    vi.stubGlobal('fetch', mockFetch(structured))
    renderDetail()

    const toggle = await screen.findByRole('button', { name: 'All laps' })
    expect(screen.queryByText('Per-interval breakdown')).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.getByText('Per-interval breakdown')).toBeInTheDocument()
  })

  it('keeps the splits for an unstructured run', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({
      splits: [{ distance: 1000, duration: 300 }, { distance: 1000, duration: 290 }, { distance: 1000, duration: 280 }],
    })))
    renderDetail()

    expect(await screen.findByText('Splits')).toBeInTheDocument()
    expect(screen.queryByText('Reps')).not.toBeInTheDocument()
  })

  it('prints minutes under each zone of a single stacked time-in-zone bar', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({
      hr_zones: [{ secsInZone: 370 }, { secsInZone: 520 }, { secsInZone: 320 }, { secsInZone: 595 }, { secsInZone: 852 }],
    })))
    const { container } = renderDetail()

    await screen.findByText('Time in zone')
    expect(container.querySelectorAll('.zone-bar span')).toHaveLength(5)
    const legend = [...container.querySelectorAll('.zone-legend > div')].map(n => n.textContent)
    expect(legend).toEqual(['6:10Zone 1', '8:40Zone 2', '5:20Zone 3', '9:55Zone 4', '14:12Zone 5'])
  })
})

describe('ActivityDetailView collapsible stats', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hides Dynamics/Power/Performance/Conditions behind "Show all stats" until expanded', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({
      avg_ground_contact_time: 242,
      avg_power: 289,
    })))

    renderDetail()
    await screen.findByRole('heading', { name: 'Tempo Run' })

    expect(screen.queryByText('Running dynamics')).not.toBeInTheDocument()
    expect(screen.queryByText('Power')).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /Show all stats/ })
    expect(toggle).toHaveTextContent('Show all')
    act(() => {
      toggle.click()
    })

    expect(screen.getByText('Running dynamics')).toBeInTheDocument()
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide extra stats' })).toBeInTheDocument()
  })
})
