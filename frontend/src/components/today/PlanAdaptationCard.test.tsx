import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import PlanAdaptationCard from './PlanAdaptationCard'
import type { PlanAdaptationSuggestion } from '../../api/types'

function suggestion(overrides: Partial<PlanAdaptationSuggestion> = {}): PlanAdaptationSuggestion {
  return {
    plan_day_id: 42,
    direction: 'downgrade',
    current_workout_type: 'Tempo',
    suggested_workout_type: 'Easy',
    current_target_distance_m: 10000,
    suggested_target_distance_m: 6000,
    reason: 'Readiness is low this morning — dial it back.',
    readiness_score: 38,
    trigger: 'readiness',
    ...overrides,
  }
}

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  })
}

describe('PlanAdaptationCard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchOk({ status: 'ok' }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the downgrade framing and the current -> suggested workout swap', () => {
    renderWithQueryClient(<PlanAdaptationCard suggestion={suggestion()} />)

    expect(screen.getByText('Suggested: ease off today')).toBeInTheDocument()
    expect(screen.getByText('Readiness is low this morning — dial it back.')).toBeInTheDocument()
    expect(screen.getByText(/Tempo/)).toBeInTheDocument()
    expect(screen.getByText(/10\.0 km/)).toBeInTheDocument()
    expect(screen.getByText(/Easy/)).toBeInTheDocument()
    expect(screen.getByText(/6\.0 km/)).toBeInTheDocument()
  })

  it('shows the upgrade framing when direction is upgrade', () => {
    renderWithQueryClient(<PlanAdaptationCard suggestion={suggestion({ direction: 'upgrade' })} />)
    expect(screen.getByText("Suggested: you're primed")).toBeInTheDocument()
  })

  it('shows the load-caution framing when triggered by injury risk, regardless of direction', () => {
    renderWithQueryClient(
      <PlanAdaptationCard suggestion={suggestion({ direction: 'upgrade', trigger: 'risk' })} />,
    )
    expect(screen.getByText('Load caution: consider easing off')).toBeInTheDocument()
  })

  it('posts an accept action for this plan day when Accept is clicked', async () => {
    const fetchMock = mockFetchOk({ status: 'ok' })
    vi.stubGlobal('fetch', fetchMock)

    renderWithQueryClient(<PlanAdaptationCard suggestion={suggestion()} />)
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/training-plan/adapt-day',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ plan_day_id: 42, action: 'accept' }),
      }),
    ))
  })

  it('posts a dismiss action for this plan day when Dismiss is clicked', async () => {
    const fetchMock = mockFetchOk({ status: 'ok' })
    vi.stubGlobal('fetch', fetchMock)

    renderWithQueryClient(<PlanAdaptationCard suggestion={suggestion()} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/training-plan/adapt-day',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ plan_day_id: 42, action: 'dismiss' }),
      }),
    ))
  })

  it('disables both actions while a mutation is in flight', async () => {
    let resolveFetch: (v: unknown) => void = () => {}
    const pending = new Promise(resolve => { resolveFetch = resolve })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending))

    renderWithQueryClient(<PlanAdaptationCard suggestion={suggestion()} />)
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /accept/i })).toBeDisabled())
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeDisabled()

    resolveFetch({ ok: true, status: 200, json: async () => ({ status: 'ok' }) })
  })
})
