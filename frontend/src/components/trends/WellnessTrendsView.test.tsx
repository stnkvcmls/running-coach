import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import { ThemeContext } from '../../App'
import WellnessTrendsView from './WellnessTrendsView'
import type { DailySummaryResponse } from '../../api/types'

function summary(overrides: Partial<DailySummaryResponse> = {}): DailySummaryResponse {
  return {
    id: 1,
    date: '2026-07-01',
    steps: 8000,
    total_calories: 2200,
    active_calories: 600,
    resting_hr: 46,
    max_hr: 180,
    stress_avg: 22,
    sleep_seconds: 27000,
    sleep_score: 82,
    body_battery_high: 85,
    body_battery_low: 20,
    intensity_minutes: 30,
    floors_climbed: 5,
    hrv_avg: 55,
    hrv_weekly_avg: 53,
    hrv_status: 'BALANCED',
    ...overrides,
  }
}

function mockFetch(data: DailySummaryResponse[]) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => data })
}

describe('WellnessTrendsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders metric cards from the mocked query, defaulting to the 30-day range', async () => {
    vi.stubGlobal('fetch', mockFetch([summary()]))
    renderWithProviders(<WellnessTrendsView />)

    expect(await screen.findByText('Sleep Score')).toBeInTheDocument()
    expect(screen.getByText('Resting Heart Rate')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders without error under the light theme (themed tooltip/tick colours)', async () => {
    vi.stubGlobal('fetch', mockFetch([summary()]))
    renderWithProviders(
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
        <WellnessTrendsView />
      </ThemeContext.Provider>,
    )

    expect(await screen.findByText('Sleep Score')).toBeInTheDocument()
    expect(screen.getByText('Body Battery')).toBeInTheDocument()
  })

  it('re-queries wellness-trends with the selected RangeSelector value', async () => {
    const fetchMock = mockFetch([summary()])
    vi.stubGlobal('fetch', fetchMock)
    renderWithProviders(<WellnessTrendsView />)
    await screen.findByText('Sleep Score')

    fireEvent.click(screen.getByRole('button', { name: '180d' }))

    expect(await screen.findByRole('button', { name: '180d' })).toHaveAttribute('aria-pressed', 'true')
    const requestedUrls = fetchMock.mock.calls.map((call: unknown[]) => String(call[0]))
    expect(requestedUrls.some(url => url.includes('/wellness-trends') && url.includes('days=180'))).toBe(true)
  })
})
