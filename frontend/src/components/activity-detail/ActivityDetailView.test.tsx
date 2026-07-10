import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ActivityDetailView from './ActivityDetailView'
import type { ActivityDetail } from '../../api/types'

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

describe('ActivityDetailView verdict chip', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the first sentence of the insight linking down to the full AiInsightCard', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail({
      insight: {
        id: 1,
        created_at: null,
        trigger_type: 'activity',
        trigger_id: 1,
        content: 'Strong tempo effort. Full breakdown below.',
        summary: null,
        category: null,
      },
    })))

    renderDetail()

    const chip = await screen.findByRole('link', { name: /Strong tempo effort\./ })
    expect(chip).toHaveAttribute('href', '#ai-insight')
  })

  it('omits the verdict chip when there is no insight yet', async () => {
    vi.stubGlobal('fetch', mockFetch(activityDetail()))
    renderDetail()

    await screen.findByRole('heading', { name: 'Tempo Run' })
    expect(screen.queryByRole('link', { name: /Full analysis/ })).not.toBeInTheDocument()
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

    expect(screen.queryByText('Running Dynamics')).not.toBeInTheDocument()
    expect(screen.queryByText('Power')).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /Show all stats/ })
    act(() => {
      toggle.click()
    })

    expect(screen.getByText('Running Dynamics')).toBeInTheDocument()
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide extra stats' })).toBeInTheDocument()
  })
})
