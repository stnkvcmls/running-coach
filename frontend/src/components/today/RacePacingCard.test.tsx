import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import RacePacingCard from './RacePacingCard'
import type { PacingStrategyResponse, RaceInfo } from '../../api/types'

const RACE: RaceInfo = {
  id: 7,
  title: 'City Marathon',
  date: '2026-10-04',
  distance_label: 'Marathon',
  days_away: 60,
  goal_time_sec: 12600,
  priority: 'A',
}

function pacingResponse(overrides: Partial<PacingStrategyResponse> = {}): PacingStrategyResponse {
  return {
    race_id: 7,
    race_name: 'City Marathon',
    distance_m: 21097.5,
    distance_label: 'Half Marathon',
    race_date: '2026-10-04',
    target_time_sec: 6300,
    target_pace_min_km: 5.0,
    strategy: 'even',
    split_unit: 'km',
    splits: [
      {
        split_number: 1,
        split_distance_m: 1000,
        cumulative_distance_m: 1000,
        target_pace_min_km: 5.0,
        split_time_sec: 300,
        cumulative_time_sec: 300,
        grade_pct: null,
      },
    ],
    predicted_time_sec: 6200,
    source: 'goal',
    course_activity_id: null,
    course_activity_name: null,
    conditions_temp_c: null,
    conditions_dew_point_c: null,
    conditions_penalty_pct: null,
    adjusted_target_time_sec: null,
    estimated_temp_c: null,
    estimated_dew_point_c: null,
    ...overrides,
  }
}

function mockFetch(plan: PacingStrategyResponse) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ status: 'pushed' }) })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => plan })
  })
}

describe('RacePacingCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts collapsed and expands the pacing body on toggle', async () => {
    vi.stubGlobal('fetch', mockFetch(pacingResponse()))
    renderWithQueryClient(<RacePacingCard race={RACE} />)

    const toggle = screen.getByRole('button', { name: /pacing strategy/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Even')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(screen.getByText('Target')).toBeInTheDocument())
  })

  it('refetches with the new strategy when a strategy button is clicked', async () => {
    const fetchMock = mockFetch(pacingResponse())
    vi.stubGlobal('fetch', fetchMock)
    renderWithQueryClient(<RacePacingCard race={RACE} />)

    fireEvent.click(screen.getByRole('button', { name: /pacing strategy/i }))
    await waitFor(() => expect(screen.getByText('Target')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Negative Split' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('strategy=negative_split'),
      ),
    )
  })

  it('shows the conditions cost line when heat adjusts the target time', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(
        pacingResponse({
          conditions_temp_c: 24,
          conditions_dew_point_c: 18,
          adjusted_target_time_sec: 6300 + 360,
        }),
      ),
    )
    renderWithQueryClient(<RacePacingCard race={RACE} />)
    fireEvent.click(screen.getByRole('button', { name: /pacing strategy/i }))

    await waitFor(() =>
      expect(screen.getByText(/costs ~\+6:00 — adjusted splits below/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/At 24°C \/ dew point 18°C/)).toBeInTheDocument()
  })

  it('pushes the pacing plan to the watch and reflects the sent state', async () => {
    vi.stubGlobal('fetch', mockFetch(pacingResponse()))
    renderWithQueryClient(<RacePacingCard race={RACE} />)
    fireEvent.click(screen.getByRole('button', { name: /pacing strategy/i }))

    const pushBtn = await screen.findByRole('button', { name: /send to watch/i })
    fireEvent.click(pushBtn)

    await waitFor(() => expect(screen.getByRole('button', { name: /sent to watch/i })).toBeDisabled())
  })
})
