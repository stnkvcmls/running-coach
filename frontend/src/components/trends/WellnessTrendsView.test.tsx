import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
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

/** `n` consecutive days ending 2026-07-30, resting HR cycling 45–49. */
function history(n: number, last: Partial<DailySummaryResponse> = {}): DailySummaryResponse[] {
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(Date.UTC(2026, 6, 30 - (n - 1 - i))).toISOString().slice(0, 10)
    return summary({ id: i + 1, date, resting_hr: 45 + (i % 5), ...(i === n - 1 ? last : {}) })
  })
}

function mockFetch(data: DailySummaryResponse[]) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => data })
}

function row(name: string): HTMLElement {
  return screen.getByText(name).closest('li') as HTMLElement
}

describe('WellnessTrendsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders one small multiple per body metric, defaulting to the 30-day range', async () => {
    vi.stubGlobal('fetch', mockFetch([summary()]))
    renderWithProviders(<WellnessTrendsView />)

    expect(await screen.findByText('Sleep score')).toBeInTheDocument()
    for (const name of ['Resting HR', 'HRV overnight', 'Body battery, daily high', 'Stress, daily average']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: '30 days' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Daily history' })).toBeInTheDocument()
    expect(screen.getByText(/Bands: Garmin's baseline for HRV; your middle 80% of the last 90 days/)).toBeInTheDocument()
  })

  it('shows the latest value and the verdict against the personal range, filling the last point when out of range', async () => {
    vi.stubGlobal('fetch', mockFetch(history(40, { resting_hr: 58 })))
    const { container } = renderWithProviders(<WellnessTrendsView />)

    await screen.findByText('Resting HR')
    const rhr = row('Resting HR')
    expect(within(rhr).getByText('58')).toBeInTheDocument()
    expect(within(rhr).getByText('Above your range')).toHaveClass('trend-status-flag')
    expect(rhr.querySelector('.trend-dot')).toHaveClass('trend-dot-flag')
    expect(rhr.querySelector('.trend-band')).toBeInTheDocument()

    // Sleep score is flat at 82, inside its own band: an open last point.
    const sleep = row('Sleep score')
    expect(within(sleep).getByText('In your usual range')).toBeInTheDocument()
    expect(sleep.querySelector('.trend-dot')).not.toHaveClass('trend-dot-flag')

    // No y-axis on the small multiples.
    expect(container.querySelector('.recharts-yAxis')).not.toBeInTheDocument()
  })

  it('takes the HRV band from Garmin’s baseline and the verdict from its status', async () => {
    vi.stubGlobal('fetch', mockFetch(history(5, { hrv_avg: 42, hrv_status: 'LOW', hrv_baseline_low: 47, hrv_baseline_high: 62 })))
    renderWithProviders(<WellnessTrendsView />)

    await screen.findByText('HRV overnight')
    const hrv = row('HRV overnight')
    expect(within(hrv).getByText('42')).toBeInTheDocument()
    expect(within(hrv).getByText('Low, per Garmin')).toHaveClass('trend-status-flag')
    expect(hrv.querySelector('.trend-band')).toBeInTheDocument()
    expect(hrv.querySelector('.trend-dot')).toHaveClass('trend-dot-flag')

    // Too little history for the percentile bands of the other metrics.
    expect(within(row('Resting HR')).getByText('No usual range yet')).toBeInTheDocument()
    expect(row('Resting HR').querySelector('.trend-band')).not.toBeInTheDocument()
  })

  it('renders without error under the light theme', async () => {
    vi.stubGlobal('fetch', mockFetch([summary()]))
    renderWithProviders(
      <ThemeContext.Provider value={{ theme: 'light', preference: 'light', setPreference: () => {} }}>
        <WellnessTrendsView />
      </ThemeContext.Provider>,
    )

    expect(await screen.findByText('Sleep score')).toBeInTheDocument()
    expect(screen.getByText('Body battery, daily high')).toBeInTheDocument()
  })

  it('re-queries wellness-trends with the selected range', async () => {
    const fetchMock = mockFetch([summary()])
    vi.stubGlobal('fetch', fetchMock)
    renderWithProviders(<WellnessTrendsView />)
    await screen.findByText('Sleep score')

    fireEvent.click(screen.getByRole('button', { name: '1 year' }))

    expect(await screen.findByRole('button', { name: '1 year' })).toHaveAttribute('aria-pressed', 'true')
    const requestedUrls = fetchMock.mock.calls.map((call: unknown[]) => String(call[0]))
    expect(requestedUrls.some(url => url.includes('/wellness-trends') && url.includes('days=365'))).toBe(true)
  })
})
