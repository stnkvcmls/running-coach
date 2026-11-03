import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
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
    if (url.includes('/training-plan/generate')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ job_id: 7 }) })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => null })
  })
}

function calledUrl(fetchMock: ReturnType<typeof mockFetch>, fragment: string): boolean {
  return fetchMock.mock.calls.some(([url]) => String(url).includes(fragment))
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
    expect(screen.getByRole('button', { name: /Week 2/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Week 1/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows a done day with its adherence score and a link to the matched activity', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 10, day_date: '2026-07-08', matched_activity_id: 123, adherence_score: 96.4 }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    expect(await screen.findByText(/Done, 96%/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /view run/i })
    expect(link).toHaveAttribute('href', '/activities/123')
  })

  it("counts today's completed run toward the week, using the actual distance", async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 12, day_date: '2026-07-10', workout_type: 'interval', target_distance_m: 9000, matched_activity_id: 55, adherence_score: 96 }),
        day({ id: 13, day_date: '2026-07-12', workout_type: 'long', target_distance_m: 20000 }),
      ]),
    ]
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/training-plan')) return Promise.resolve({ ok: true, status: 200, json: async () => plan(weeks) })
      if (url.endsWith('/activities/55')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 55, distance_m: 9220 }) })
      return Promise.resolve({ ok: true, status: 200, json: async () => null })
    })
    vi.stubGlobal('fetch', fetchMock)
    renderWithProviders(<PlanView />)

    expect(await screen.findByText('9.22')).toBeInTheDocument()
    expect(screen.getByText(/of 29 km/)).toBeInTheDocument()
    expect(screen.getByText('9.2')).toBeInTheDocument()
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

  it('shows Send to watch only on the next upcoming session', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 20, day_date: '2026-07-10', day_of_week: 'Friday', workout_type: 'tempo', description: 'Today tempo' }),
        day({ id: 21, day_date: '2026-07-11', day_of_week: 'Saturday', workout_type: 'easy', description: 'Tomorrow easy' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    await screen.findByText('Today tempo')
    expect(screen.getByText('Tomorrow easy')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: /to watch/i })
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName("Send Friday's tempo run to watch")
  })

  it('skips rest and cross days when picking the session to send', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 25, day_date: '2026-07-10', day_of_week: 'Friday', workout_type: 'rest', target_distance_m: null, description: 'Rest day' }),
        day({ id: 26, day_date: '2026-07-11', day_of_week: 'Saturday', workout_type: 'cross', description: 'Bike' }),
        day({ id: 27, day_date: '2026-07-12', day_of_week: 'Sunday', workout_type: 'long', description: 'Long one' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    await screen.findByText('Long one')
    const buttons = screen.getAllByRole('button', { name: /to watch/i })
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName("Send Sunday's long run to watch")
  })

  it('shows no Send to watch on a later week while an earlier session is still ahead', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 28, day_date: '2026-07-11', workout_type: 'easy', description: 'This week easy' }),
      ]),
      week(2, '2026-07-13', '2026-07-19', [
        day({ id: 29, week_number: 2, day_date: '2026-07-14', workout_type: 'easy', description: 'Next week easy' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    await screen.findByText('This week easy')
    fireEvent.click(screen.getByRole('button', { name: /Week 2/ }))
    expect(await screen.findByText('Next week easy')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /to watch/i })).not.toBeInTheDocument()
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
    expect(screen.queryByRole('button', { name: /to watch/i })).not.toBeInTheDocument()
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
    expect(screen.queryByRole('button', { name: /to watch/i })).not.toBeInTheDocument()
  })

  it('hides a note repeated across the week but keeps one that differs', async () => {
    const boiler = 'Keep it conversational.'
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 30, day_date: '2026-07-11', notes: boiler }),
        day({ id: 31, day_date: '2026-07-12', notes: boiler }),
        day({ id: 32, day_date: '2026-07-13', notes: boiler }),
        day({ id: 33, day_date: '2026-07-14', notes: 'Hilly route, ease off on the climbs.' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    expect(await screen.findByText('Hilly route, ease off on the climbs.')).toBeInTheDocument()
    expect(screen.queryByText(boiler)).not.toBeInTheDocument()
  })

  it('shows a note that does not repeat', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 34, day_date: '2026-07-11', notes: 'Only note' }),
        day({ id: 37, day_date: '2026-07-12', notes: 'Another note' }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    expect(await screen.findByText('Only note')).toBeInTheDocument()
    expect(screen.getByText('Another note')).toBeInTheDocument()
  })

  it('writes a structured session in notation with a structure strip, and a steady one as distance and pace', async () => {
    const weeks = [
      week(1, '2026-07-06', '2026-07-12', [
        day({ id: 35, day_date: '2026-07-11', workout_type: 'interval', target_distance_m: 10000, description: '6 x 800m @ 4:00/km with 400m jog' }),
        day({ id: 36, day_date: '2026-07-12', workout_type: 'easy', target_distance_m: 9500, target_pace_min_km: 5.7 }),
      ]),
    ]
    vi.stubGlobal('fetch', mockFetch(plan(weeks)))
    renderWithProviders(<PlanView />)

    expect(await screen.findByText('6 × 800 m at 4:00 /km, 400 m jog between')).toBeInTheDocument()
    expect(screen.getByText('9.5 km at 5:42 /km')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /workout structure/i })).toHaveLength(1)
  })

  it('keeps Preferences and Regenerate behind the options menu, with a confirm step', async () => {
    const weeks = [week(1, '2026-07-06', '2026-07-12', [day({ id: 40, day_date: '2026-07-11', description: 'Some run' })])]
    const fetchMock = mockFetch(plan(weeks))
    vi.stubGlobal('fetch', fetchMock)
    renderWithProviders(<PlanView />)

    await screen.findByText('Some run')
    expect(screen.queryByRole('button', { name: /^regenerate/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /plan options/i }))
    expect(screen.getByRole('button', { name: /training preferences/i })).toBeInTheDocument()
    expect(screen.getByText('Build phase, generated 1 Jul')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /regenerate plan/i }))
    expect(calledUrl(fetchMock, '/training-plan/generate')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /^regenerate$/i }))
    await waitFor(() => expect(calledUrl(fetchMock, '/training-plan/generate')).toBe(true))
  })
})
