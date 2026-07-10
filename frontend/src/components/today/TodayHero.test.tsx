import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import TodayHero from './TodayHero'
import type { TodayResponse, TrainingPlanDay, TrainingPlanResponse } from '../../api/types'

function today(overrides: Partial<TodayResponse> = {}): TodayResponse {
  return {
    selected_date: '2026-07-09',
    activities: [],
    daily_summary: null,
    weekly_data: [],
    insights: [],
    next_races: [],
    scheduled_events: [],
    training_load: null,
    readiness: null,
    plan_adaptation: null,
    daily_checkin: null,
    plan_day_id: null,
    briefing: null,
    ...overrides,
  }
}

function planDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 5,
    plan_id: 1,
    day_date: '2026-07-09',
    day_of_week: 'Thursday',
    week_number: 1,
    workout_type: 'tempo',
    target_distance_m: null,
    target_pace_min_km: null,
    target_pace_display: null,
    description: null,
    notes: null,
    week_theme: null,
    routine: null,
    fuelling_guidance: null,
    matched_activity_id: null,
    adherence_score: null,
    ...overrides,
  }
}

function trainingPlan(days: TrainingPlanDay[]): TrainingPlanResponse {
  return {
    id: 1,
    generated_at: '2026-07-06T00:00:00Z',
    week_start: '2026-07-06',
    plan_weeks: 4,
    phase: 'build',
    overview: null,
    weeks: [{ week_number: 1, week_start: '2026-07-06', week_end: '2026-07-12', theme: null, days }],
  }
}

function mockFetch(trainingPlanResponse: TrainingPlanResponse | null) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.endsWith('/training-plan')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => trainingPlanResponse })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
  })
}

describe('TodayHero', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('planned: shows the type badge, distance and pace from the matching training plan day', async () => {
    vi.stubGlobal('fetch', mockFetch(trainingPlan([
      planDay({ id: 5, workout_type: 'tempo', target_distance_m: 10000, target_pace_display: '4:45/km' }),
    ])))
    renderWithProviders(<TodayHero data={today({ plan_day_id: 5 })} />)

    expect(await screen.findByText('Tempo')).toBeInTheDocument()
    expect(screen.getByText(/10\.0 km/)).toBeInTheDocument()
    expect(screen.getByText(/4:45\/km/)).toBeInTheDocument()
  })

  it('completed: links to the matched activity when workout_tag is set', () => {
    vi.stubGlobal('fetch', mockFetch(null))
    const data = today({
      activities: [{
        id: 77,
        garmin_id: null,
        activity_type: 'running',
        name: 'Tempo Run',
        started_at: '2026-07-09T06:00:00Z',
        duration_sec: 2820,
        distance_m: 10200,
        avg_hr: 150,
        max_hr: 170,
        avg_pace_min_km: 4.7,
        calories: 700,
        elevation_gain: 50,
        workout_tag: 'Tempo Run',
      }],
    })
    renderWithProviders(<TodayHero data={data} />)

    const link = screen.getByRole('link', { name: /done.*tempo run/i })
    expect(link).toHaveAttribute('href', '/activities/77')
  })

  it('rest: shows "Rest day" when the matching plan day is a rest day', async () => {
    vi.stubGlobal('fetch', mockFetch(trainingPlan([planDay({ id: 9, workout_type: 'rest' })])))
    renderWithProviders(<TodayHero data={today({ plan_day_id: 9 })} />)

    expect(await screen.findByText('Rest day')).toBeInTheDocument()
  })

  it('no plan: links to /plan to set one up when no training plan exists at all', async () => {
    vi.stubGlobal('fetch', mockFetch(null))
    renderWithProviders(<TodayHero data={today()} />)

    const link = await screen.findByRole('link', { name: /set up a plan/i })
    expect(link).toHaveAttribute('href', '/plan')
  })

  it('no session today: links to /chat when a plan exists but nothing is scheduled today', async () => {
    vi.stubGlobal('fetch', mockFetch(trainingPlan([planDay({ id: 1, day_date: '2026-07-06' })])))
    renderWithProviders(<TodayHero data={today({ plan_day_id: null })} />)

    const link = await screen.findByRole('link', { name: /ask your coach/i })
    expect(link).toHaveAttribute('href', '/chat')
  })
})
