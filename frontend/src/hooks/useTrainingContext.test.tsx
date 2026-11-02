import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { RaceInfo, SeasonPlanResponse, SeasonPlanWeek, TrainingPlanResponse } from '../api/types'
import {
  deriveTrainingContext,
  formatBlockLine,
  formatGoalLine,
  useTrainingContext,
  type TrainingContext,
} from './useTrainingContext'

/** A 4-week rolling plan whose first week starts Monday 22 June 2026. */
function plan(overrides: Partial<TrainingPlanResponse> = {}): TrainingPlanResponse {
  const starts = ['2026-06-22', '2026-06-29', '2026-07-06', '2026-07-13']
  const ends = ['2026-06-28', '2026-07-05', '2026-07-12', '2026-07-19']
  return {
    id: 1,
    generated_at: '2026-06-21T08:00:00Z',
    week_start: starts[0],
    plan_weeks: 4,
    phase: 'build',
    overview: null,
    // Deliberately out of order: the derivation must sort by week_start.
    weeks: [3, 0, 2, 1].map(i => ({
      week_number: i + 1, week_start: starts[i], week_end: ends[i], theme: null, days: [],
    })),
    ...overrides,
  }
}

function seasonWeek(week_number: number, week_start: string, phase: string): SeasonPlanWeek {
  return { week_number, week_start, phase, target_weekly_km: null, notes: null }
}

/** base ×2, build ×3, peak ×1, taper ×1 from Monday 1 June 2026; goal on 20 July. */
function season(overrides: Partial<SeasonPlanResponse> = {}): SeasonPlanResponse {
  return {
    id: 1,
    generated_at: '2026-05-30T08:00:00Z',
    start_date: '2026-06-01',
    goal_race_title: 'Berlin Marathon',
    goal_race_date: '2026-07-20',
    goal_race_distance_m: 42195,
    peak_weekly_km: 80,
    weeks: [
      seasonWeek(1, '2026-06-01', 'base'),
      seasonWeek(2, '2026-06-08', 'base'),
      seasonWeek(3, '2026-06-15', 'build'),
      seasonWeek(4, '2026-06-22', 'build'),
      seasonWeek(5, '2026-06-29', 'build'),
      seasonWeek(6, '2026-07-06', 'peak'),
      seasonWeek(7, '2026-07-13', 'taper'),
    ],
    ...overrides,
  }
}

function race(overrides: Partial<RaceInfo> = {}): RaceInfo {
  return {
    id: 1, title: 'City 10K', date: '2026-07-11', distance_label: '10K',
    days_away: 18, goal_time_sec: null, priority: 'C', ...overrides,
  }
}

const derive = (args: Partial<Parameters<typeof deriveTrainingContext>[0]> = {}) =>
  deriveTrainingContext({ plan: null, season: null, races: [], dateKey: '2026-06-23', ...args })

describe('deriveTrainingContext: block', () => {
  it('uses the training plan week containing the date, and its phase', () => {
    expect(derive({ plan: plan(), season: season() })).toMatchObject({
      phaseLabel: 'Build', weekOfBlock: 1, blockWeeks: 4,
    })
    expect(derive({ plan: plan(), dateKey: '2026-07-19' })).toMatchObject({ weekOfBlock: 4 })
  })

  it('reports the plan week without a phase rather than mixing in the season phase', () => {
    expect(derive({ plan: plan({ phase: null }), season: season() })).toMatchObject({
      phaseLabel: null, weekOfBlock: 1, blockWeeks: 4,
    })
  })

  it('falls back to the run of same-phase season weeks when the plan does not cover the date', () => {
    // 2026-06-17 is in season week 3, the first of three build weeks.
    expect(derive({ plan: plan(), season: season(), dateKey: '2026-06-17' })).toMatchObject({
      phaseLabel: 'Build', weekOfBlock: 1, blockWeeks: 3,
    })
    // 2026-07-01 (Wed) is in season week 5, the last build week; no plan at all.
    expect(derive({ season: season(), dateKey: '2026-07-01' })).toMatchObject({
      phaseLabel: 'Build', weekOfBlock: 3, blockWeeks: 3,
    })
    expect(derive({ season: season(), dateKey: '2026-07-07' })).toMatchObject({
      phaseLabel: 'Peak', weekOfBlock: 1, blockWeeks: 1,
    })
  })

  it('is empty when neither plan covers the date', () => {
    expect(derive({ plan: plan(), season: season(), dateKey: '2026-09-01' })).toMatchObject({
      phaseLabel: null, weekOfBlock: null, blockWeeks: null,
    })
    expect(derive()).toEqual({
      phaseLabel: null, weekOfBlock: null, blockWeeks: null, goalRaceName: null, daysToGoal: null,
    })
  })
})

describe('deriveTrainingContext: goal race', () => {
  it("prefers the season plan's goal race", () => {
    expect(derive({ season: season(), races: [race({ priority: 'A' })] })).toMatchObject({
      goalRaceName: 'Berlin Marathon', daysToGoal: 27,
    })
  })

  it('falls back to the next A race once the season goal has passed, else the next race', () => {
    const races = [
      race({ id: 2, title: 'Half', date: '2026-09-01', priority: 'A' }),
      race({ id: 1, title: 'City 10K', date: '2026-07-11', priority: 'C' }),
      race({ id: 3, title: 'Old race', date: '2026-06-01', priority: 'A' }),
    ]
    const pastGoal = season({ goal_race_date: '2026-06-01' })
    expect(derive({ season: pastGoal, races })).toMatchObject({ goalRaceName: 'Half', daysToGoal: 70 })
    expect(derive({ races: races.filter(r => r.priority !== 'A') })).toMatchObject({
      goalRaceName: 'City 10K', daysToGoal: 18,
    })
  })

  it('names untitled races by distance, then generically', () => {
    expect(derive({ races: [race({ title: null })] }).goalRaceName).toBe('10K')
    expect(derive({ races: [race({ title: null, distance_label: null })] }).goalRaceName).toBe('Race')
    expect(derive({ season: season({ goal_race_title: null }) }).goalRaceName).toBe('Goal race')
  })

  it('is empty with no upcoming race', () => {
    expect(derive({ races: [race({ date: '2026-06-01' })] })).toMatchObject({
      goalRaceName: null, daysToGoal: null,
    })
  })
})

describe('formatBlockLine / formatGoalLine', () => {
  const ctx = (o: Partial<TrainingContext>): TrainingContext => ({
    phaseLabel: null, weekOfBlock: null, blockWeeks: null, goalRaceName: null, daysToGoal: null, ...o,
  })

  it('formats the block, with or without a phase', () => {
    expect(formatBlockLine(ctx({ phaseLabel: 'Build', weekOfBlock: 1, blockWeeks: 4 }))).toBe('Build block, week 1 of 4')
    expect(formatBlockLine(ctx({ weekOfBlock: 2, blockWeeks: 4 }))).toBe('Week 2 of 4')
    expect(formatBlockLine(ctx({ phaseLabel: 'Build' }))).toBeNull()
  })

  it('formats the goal countdown', () => {
    expect(formatGoalLine(ctx({ goalRaceName: 'Berlin Marathon', daysToGoal: 90 }))).toBe('Berlin Marathon in 90 days')
    expect(formatGoalLine(ctx({ goalRaceName: 'Berlin Marathon', daysToGoal: 1 }))).toBe('Berlin Marathon tomorrow')
    expect(formatGoalLine(ctx({ goalRaceName: 'Berlin Marathon', daysToGoal: 0 }))).toBe('Berlin Marathon today')
    expect(formatGoalLine(ctx({ goalRaceName: 'Berlin Marathon' }))).toBeNull()
  })
})

describe('useTrainingContext', () => {
  afterEach(() => vi.unstubAllGlobals())

  function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  function stubApi(body: { plan: unknown; season: unknown; today?: unknown }) {
    const fetchMock = vi.fn((url: string) => {
      const json = url.includes('/season-plan') ? body.season
        : url.includes('/training-plan') ? body.plan
        : url.includes('/today') ? body.today
        : undefined
      return Promise.resolve({ ok: true, status: 200, json: async () => json })
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  const requested = (fetchMock: ReturnType<typeof stubApi>) =>
    fetchMock.mock.calls.map(call => String(call[0]))

  it("doesn't fetch /today when the season plan names the goal race", async () => {
    const fetchMock = stubApi({ plan: plan(), season: season() })
    const { result } = renderHook(() => useTrainingContext(new Date(2026, 5, 23)), { wrapper })

    await waitFor(() => expect(result.current.goalRaceName).toBe('Berlin Marathon'))
    expect(result.current).toMatchObject({ phaseLabel: 'Build', weekOfBlock: 1, blockWeeks: 4, daysToGoal: 27 })
    expect(requested(fetchMock).some(url => url.includes('/today'))).toBe(false)
  })

  it('reads races from /today for the same date when there is no season plan', async () => {
    const fetchMock = stubApi({
      plan: null,
      season: null,
      today: { next_races: [race({ title: 'City 10K', date: '2026-07-11', priority: 'A' })] },
    })
    const { result } = renderHook(() => useTrainingContext(new Date(2026, 5, 23)), { wrapper })

    await waitFor(() => expect(result.current.goalRaceName).toBe('City 10K'))
    expect(result.current.daysToGoal).toBe(18)
    expect(requested(fetchMock).some(url => url.includes('/today?date=2026-06-23'))).toBe(true)
  })
})
