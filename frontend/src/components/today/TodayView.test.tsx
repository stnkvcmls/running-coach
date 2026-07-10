import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import TodayView from './TodayView'
import type { TodayResponse, TrainingPlanResponse, PlanRealignmentStatus } from '../../api/types'

const TODAY: TodayResponse = {
  selected_date: '2026-07-09',
  activities: [{
    id: 3, garmin_id: null, activity_type: 'running', name: 'Easy shakeout',
    started_at: '2026-07-09T17:00:00Z', duration_sec: 1800, distance_m: 5000,
    avg_hr: 140, max_hr: 155, avg_pace_min_km: 6.0, calories: 300, elevation_gain: 10,
    workout_tag: null,
  }],
  daily_summary: {
    id: 42, date: '2026-07-09', steps: 8000, total_calories: 2200, active_calories: 600,
    resting_hr: 46, max_hr: 170, stress_avg: 30, sleep_seconds: 27000, sleep_score: 82,
    body_battery_high: 71, body_battery_low: 20, intensity_minutes: 40, floors_climbed: 8,
    hrv_avg: 55, hrv_weekly_avg: 53, hrv_status: 'balanced',
  },
  weekly_data: [{ label: 'Jul 06', km: 42, by_type: { run: 42 } }],
  insights: [{ id: 1, created_at: '2026-07-09T00:00:00Z', trigger_type: 'trend', trigger_id: null, content: 'Full insight text', summary: 'Easy-run HR is trending down.', category: 'trend' }],
  next_races: [{ id: 9, title: 'Berlin Marathon', date: '2026-10-04', distance_label: 'Marathon', days_away: 73, goal_time_sec: 11700, priority: 'A' }],
  scheduled_events: [],
  training_load: {
    date: '2026-07-09', tss: 50, ctl: 52, atl: 61, tsb: -9, acwr: 1.1,
    ramp_rate_7d: null, ramp_rate_28d: null, injury_risk: 'low',
    form_zone: 'neutral', form_zone_label: 'Neutral', rsb_zone: 'productive',
    rsb_zone_label: 'Productive', rsb_recommendation: null, sport_breakdown: null,
  },
  readiness: {
    score: 78, label: 'Good', sleep_component: 80, recovery_component: 75,
    fatigue_component: 70, rhr_component: 82, hrv_component: 76, subjective_component: null,
  },
  plan_adaptation: {
    plan_day_id: 5, direction: 'downgrade', current_workout_type: 'Tempo',
    suggested_workout_type: 'Easy', current_target_distance_m: 10000,
    suggested_target_distance_m: 6000, reason: 'Readiness is low.',
    readiness_score: 38, trigger: 'readiness',
  },
  daily_checkin: null,
  plan_day_id: null,
  briefing: null,
}

const REALIGNMENT: PlanRealignmentStatus = {
  should_prompt: true,
  missed_count: 2,
  total_scheduled: 5,
  missed_sessions: [],
  race_note: null,
}

const EMPTY_PLAN: TrainingPlanResponse | null = null

function mockFetch() {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('/realignment-status')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => REALIGNMENT })
    }
    if (url.endsWith('/training-plan')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => EMPTY_PLAN })
    }
    if (url.includes('/today')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => TODAY })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
  })
}

describe('TodayView section order', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders titled sections in the new hierarchy: glance, training load, week overview, insights, also today', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderWithProviders(<TodayView />)

    await screen.findByText('At a Glance')

    const headingTexts = screen.getAllByRole('heading').map(h => h.textContent)
    const expectedInOrder = ['At a Glance', 'Training Load', 'Week', 'My Insights', 'Also today']
    const indices = expectedInOrder.map(expected =>
      headingTexts.findIndex(text => text?.includes(expected)),
    )

    expect(indices).toEqual([...indices].sort((a, b) => a - b))
    expect(indices.every(i => i >= 0)).toBe(true)
  })

  it('puts the alert banner, hero, and check-in chip above the at-a-glance heading', async () => {
    vi.stubGlobal('fetch', mockFetch())
    const { container } = renderWithProviders(<TodayView />)

    await screen.findByText('At a Glance')
    await screen.findByText(/sessions missed/)

    const html = container.innerHTML
    const alertPos = html.indexOf('sessions missed')
    const heroPos = html.indexOf("Today's session")
    const glancePos = html.indexOf('At a Glance')

    expect(alertPos).toBeGreaterThan(-1)
    expect(heroPos).toBeGreaterThan(-1)
    expect(alertPos).toBeLessThan(heroPos)
    expect(heroPos).toBeLessThan(glancePos)
  })

  it('lists the non-matching activity under "Also today"', async () => {
    vi.stubGlobal('fetch', mockFetch())
    renderWithProviders(<TodayView />)

    const heading = await screen.findByText('Also today')
    const section = heading.closest('section')
    expect(section).not.toBeNull()
    expect(section).toHaveTextContent('Easy shakeout')
  })

  it('groups sections into the desktop two-column layout without changing document order', async () => {
    vi.stubGlobal('fetch', mockFetch())
    const { container } = renderWithProviders(<TodayView />)
    await screen.findByText('At a Glance')
    await screen.findByText(/sessions missed/)

    const left = container.querySelector('.today-col-left')
    const right = container.querySelector('.today-col-right')
    expect(left).not.toBeNull()
    expect(right).not.toBeNull()

    // Left column: alert banner, hero, check-in, plan-adaptation, races.
    expect(left).toHaveTextContent('sessions missed')
    expect(left).toHaveTextContent("Today's session")
    expect(left).toHaveTextContent('Berlin Marathon')

    // Right column: at-a-glance, training load, week overview.
    expect(right).toHaveTextContent('At a Glance')
    expect(right).toHaveTextContent('Training Load')
    expect(right).toHaveTextContent('Week')

    // Insights and "Also today" render full-width, after both columns.
    const columns = container.querySelector('.today-columns')
    const insights = screen.getByText('My Insights').closest('section')
    const alsoToday = screen.getByText('Also today').closest('section')
    expect(columns).not.toBeNull()
    expect(insights).not.toBeNull()
    expect(alsoToday).not.toBeNull()
    // Both full-width sections come after the two-column group in the DOM.
    expect(columns!.compareDocumentPosition(insights!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(columns!.compareDocumentPosition(alsoToday!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
