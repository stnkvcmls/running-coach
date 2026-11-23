import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import TrendsView from './TrendsView'

const LOAD_POINT = {
  date: '2026-07-01', tss: 50, ctl: 62, atl: 44, tsb: 17, acwr: 1.1,
  ramp_rate_7d: null, ramp_rate_28d: null, injury_risk: 'low',
  form_zone: 'very_fresh', form_zone_label: 'Very fresh — detraining risk',
  rsb_zone: 'productive', rsb_zone_label: 'Productive', rsb_recommendation: null,
  sport_breakdown: null,
}

/** Empty-but-well-formed payload per endpoint, so every sub-view reaches its
 * empty state instead of choking on a bare []. */
function mockApi() {
  return vi.fn((url: string) => {
    const body = url.includes('/training-load') ? { points: [LOAD_POINT], current: LOAD_POINT }
      : url.includes('/performance-curve') ? { pace_points: [], power_points: [], deltas: [] }
      : url.includes('/intensity-trends') ? { weeks: [], zone_type: 'hr', days: 90 }
      : url.includes('/aerobic-trends') ? { points: [], days: 90 }
      : url.includes('/personal-records')
        ? { current_bests: [], recent: [], recent_days: 90, distance_bests: {}, distance_labels: [] }
      : url.includes('/wellness-trends') ? [{ id: 1, date: '2026-07-01', sleep_score: 82, resting_hr: 46 }]
        : []
    return Promise.resolve({ ok: true, status: 200, json: async () => body })
  })
}

describe('TrendsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a tablist with Body, Fitness and Records', () => {
    vi.stubGlobal('fetch', mockApi())
    renderWithProviders(<TrendsView />)

    expect(screen.getByRole('tablist', { name: 'Progress views' })).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(t => t.textContent)).toEqual(['Body', 'Fitness', 'Records'])
  })

  it('marks only the active tab selected and switches panels on click', () => {
    vi.stubGlobal('fetch', mockApi())
    renderWithProviders(<TrendsView />)

    const bodyTab = screen.getByRole('tab', { name: 'Body' })
    const recordsTab = screen.getByRole('tab', { name: 'Records' })
    expect(bodyTab).toHaveAttribute('aria-selected', 'true')
    expect(recordsTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'trends-tab-body')

    fireEvent.click(recordsTab)

    expect(recordsTab).toHaveAttribute('aria-selected', 'true')
    expect(bodyTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'trends-tab-records')
    expect(recordsTab).toHaveAttribute('aria-controls', 'trends-panel-records')
  })

  it('Fitness stacks Fitness & fatigue, Weekly volume, Performance, Intensity and Aerobic as sections', async () => {
    vi.stubGlobal('fetch', mockApi())
    renderWithProviders(<TrendsView />)

    fireEvent.click(screen.getByRole('tab', { name: 'Fitness' }))

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', 'trends-tab-fitness')
    const headings = within(panel).getAllByRole('heading', { level: 2 })
    expect(headings.map(h => h.textContent)).toEqual([
      'Fitness & fatigue', 'Weekly volume', 'Performance curve', 'Intensity', 'Aerobic efficiency',
    ])
    // Each heading labels its own section region.
    for (const h of headings) {
      expect(within(panel).getByRole('region', { name: h.textContent! })).toBeInTheDocument()
    }
    // The performance curve's explainer link moved up to its section heading.
    expect(within(panel).getByRole('button', { name: 'About Performance curve' })).toBeInTheDocument()

    // Sub-views mount cleanly: Form renders its sentence, others reach empty states.
    expect(await within(panel).findByText('Very fresh, +17.')).toBeInTheDocument()
    expect(await within(panel).findByText(/no mean-maximal curve data yet/i)).toBeInTheDocument()
    expect(await within(panel).findByText(/no zone data available/i)).toBeInTheDocument()
    expect(await within(panel).findByText(/no aerobic data yet/i)).toBeInTheDocument()
    expect(screen.queryByText('Build a chart')).not.toBeInTheDocument()
  })

  it('drops the sub-view headings that repeated the tab or section name', async () => {
    vi.stubGlobal('fetch', mockApi())
    renderWithProviders(<TrendsView />)

    // Body: straight from the range control to the charts — no "Wellness Trends" heading.
    await screen.findByText('Sleep score')
    expect(within(screen.getByRole('tabpanel')).queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /daily history/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Fitness' }))
    await screen.findByText(/no aerobic data yet/i)
    expect(screen.queryByRole('heading', { name: 'Form' })).not.toBeInTheDocument()
    expect(screen.queryByText('Performance Curve')).not.toBeInTheDocument()
    expect(screen.queryByText('Aerobic Efficiency')).not.toBeInTheDocument()
  })
})
