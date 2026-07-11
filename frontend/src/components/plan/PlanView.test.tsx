import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import PlanView from './PlanView'
import type { TrainingPlanDay, TrainingPlanResponse, TrainingPlanWeek } from '../../api/types'

function day(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: overrides.id ?? 1,
    plan_id: 1,
    day_date: '2026-07-06',
    day_of_week: 'Monday',
    week_number: 1,
    workout_type: 'easy',
    target_distance_m: 8000,
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

function week(weekNumber: number, weekStart: string, weekEnd: string, days: TrainingPlanDay[]): TrainingPlanWeek {
  return { week_number: weekNumber, week_start: weekStart, week_end: weekEnd, theme: null, days }
}

function plan(weeks: TrainingPlanWeek[]): TrainingPlanResponse {
  return {
    id: 1,
    generated_at: '2026-07-01T00:00:00Z',
    week_start: weeks[0].week_start,
    plan_weeks: weeks.length,
    phase: 'build',
    overview: null,
    weeks,
  }
}

function mockFetch(planResponse: TrainingPlanResponse | null) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.endsWith('/training-plan')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => planResponse })
    }
    if (url.includes('/season-plan') || url.includes('/realignment-status')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => null })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => null })
  })
}

describe('PlanView', () => {
  beforeEach(() => {
    // Only fake Date — react-query's fetch resolution and testing-library's
    // findBy* polling both rely on real setTimeout/microtask scheduling.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-07-10T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('auto-selects the week containing today, not week 1', async () => {
    const weeks = [
      week(1, '2026-06-29', '2026-07-05', [day({ id: 1, day_date: '2026-06-29', description: 'Week one day' })]),
      week(2, '2026-07-06', '2026-07-12', [day({ id: 2, week_number: 2, day_date: '2026-07-10', description: 'Week two day' })]),
      week(3, '2026-07-13', '2026-07-19', [day({ id: 3, week_number: 3, day_date: '2026-07-13', description: 'Week three day' })]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    expect(await screen.findByText('Week two day')).toBeInTheDocument()
    expect(screen.queryByText('Week one day')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /W2/ })).toHaveClass('active')
  })

  it('shows a done day with its adherence score and a link to the matched activity', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 10, day_date: '2026-07-08', matched_activity_id: 123, adherence_score: 96.4 }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    expect(await screen.findByText(/Done · 96% adherence/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /view run/i })
    expect(link).toHaveAttribute('href', '/activities/123')
  })

  it('shows "Missed" for a past day with no matching activity', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 11, day_date: '2026-07-08', workout_type: 'interval', matched_activity_id: null }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    expect(await screen.findByText('Missed')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /view run/i })).not.toBeInTheDocument()
  })

  it('shows Send to watch for today and upcoming rows', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 20, day_date: '2026-07-10', workout_type: 'tempo', description: 'Today tempo' }),
        day({ id: 21, day_date: '2026-07-11', workout_type: 'easy', description: 'Tomorrow easy' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    await screen.findByText('Today tempo')
    expect(screen.getByText('Tomorrow easy')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /send to watch/i })).toHaveLength(2)
  })

  it('hides Send to watch for done and missed (past) rows', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 22, day_date: '2026-07-08', workout_type: 'tempo', matched_activity_id: 5, description: 'Done tempo' }),
        day({ id: 23, day_date: '2026-07-09', workout_type: 'easy', matched_activity_id: null, description: 'Missed easy' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    await screen.findByText('Done tempo')
    expect(screen.getByText('Missed easy')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send to watch/i })).not.toBeInTheDocument()
  })

  it('hides Send to watch for a cross-training day even when it is today', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 24, day_date: '2026-07-10', workout_type: 'cross', description: 'Today cross' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    await screen.findByText('Today cross')
    expect(screen.queryByRole('button', { name: /send to watch/i })).not.toBeInTheDocument()
  })
})
