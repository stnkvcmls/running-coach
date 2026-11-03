import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { renderWithProviders } from '../../test/test-utils'
import { DateContext } from '../../App'
import WeekRail, { buildRailDays } from './WeekRail'
import type { CalendarDay, TrainingPlanDay, TrainingPlanResponse } from '../../api/types'
import { getWeekDays } from '../../utils/date'

function planDay(day_date: string, workout_type: string, km: number | null, matched: number | null = null): TrainingPlanDay {
  return {
    id: Number(day_date.slice(-2)), plan_id: 1, day_date, day_of_week: '', week_number: 1, workout_type,
    target_distance_m: km != null ? km * 1000 : null, target_pace_min_km: null, target_pace_display: null,
    description: null, notes: null, week_theme: null, routine: null, fuelling_guidance: null,
    matched_activity_id: matched, adherence_score: null,
  }
}

const WEEK = getWeekDays(new Date(2026, 5, 23)) // Mon 22 – Sun 28 June 2026
const PLAN_DAYS = [
  planDay('2026-06-22', 'easy', 9),
  planDay('2026-06-23', 'interval', 9.3, 77),
  planDay('2026-06-24', 'easy', 9),
  planDay('2026-06-25', 'tempo', 11.5),
  planDay('2026-06-26', 'rest', null),
  planDay('2026-06-27', 'easy', 9),
  planDay('2026-06-28', 'long', 22),
]
const CALENDAR: CalendarDay[] = [{
  date: '2026-06-23',
  events: [],
  activities: [{
    id: 77, garmin_id: null, activity_type: 'running', name: 'Intervals', started_at: null, duration_sec: 2657,
    distance_m: 9220, avg_hr: null, max_hr: null, avg_pace_min_km: null, calories: null, elevation_gain: null,
  }],
}]

describe('buildRailDays', () => {
  it('marks done, missed, planned and rest days with effort colours', () => {
    const rail = buildRailDays(WEEK, PLAN_DAYS, CALENDAR, '2026-06-23')
    expect(rail.map(d => d.state)).toEqual(['missed', 'done', 'planned', 'planned', 'rest', 'planned', 'planned'])
    expect(rail[1].color).toBe('var(--color-interval)')
    expect(rail[3].color).toBe('var(--color-tempo)')
    expect(rail[6].km).toBe(22)
  })

  it('shows an unplanned run as done with its own distance', () => {
    const rail = buildRailDays(WEEK, [], CALENDAR, '2026-06-23')
    expect(rail[1]).toMatchObject({ state: 'done', km: 9.22 })
    expect(rail[0].state).toBe('rest')
  })
})

function plan(): TrainingPlanResponse {
  return {
    id: 1, generated_at: '', week_start: '2026-06-22', plan_weeks: 1, phase: 'build', overview: null,
    weeks: [{ week_number: 1, week_start: '2026-06-22', week_end: '2026-06-28', theme: null, days: PLAN_DAYS }],
  }
}

function Harness() {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 23))
  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      <WeekRail />
      <output data-testid="selected">{selectedDate.toDateString()}</output>
    </DateContext.Provider>
  )
}

describe('WeekRail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('names each day, sums the week against the plan, and selects a day on tap', async () => {
    // Pin only Date (tasks/lessons.md): findBy* needs real timers.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 5, 23, 12))
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const body = url.endsWith('/training-plan') ? plan() : url.includes('/calendar/week') ? CALENDAR : {}
      return Promise.resolve({ ok: true, status: 200, json: async () => body })
    }))
    renderWithProviders(<Harness />)

    const thursday = await screen.findByRole('button', { name: 'Thursday 25, tempo 11.5 km, planned' })
    expect(screen.getByRole('button', { name: 'Tuesday 23, intervals 9.3 km, done' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Friday 26, rest' })).toBeInTheDocument()
    expect(await screen.findByText(/of 69.8 km this week/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plan' })).toHaveAttribute('href', '/plan')

    fireEvent.click(thursday)
    expect(screen.getByTestId('selected')).toHaveTextContent('Thu Jun 25 2026')
    expect(thursday).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.getByTestId('selected')).toHaveTextContent('Thu Jul 02 2026')
  })
})
