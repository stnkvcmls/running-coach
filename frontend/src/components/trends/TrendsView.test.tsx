import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import TrendsView from './TrendsView'

describe('TrendsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a tablist with all six tabs in the plan-specified order', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }))
    renderWithProviders(<TrendsView />)

    expect(screen.getByRole('tablist', { name: 'Progress views' })).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(t => t.textContent)).toEqual([
      'Wellness', 'Performance', 'Intensity', 'Aerobic', 'Records', 'Custom',
    ])
  })

  it('marks only the active tab selected and switches panels on click', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] }))
    renderWithProviders(<TrendsView />)

    const wellnessTab = screen.getByRole('tab', { name: 'Wellness' })
    const recordsTab = screen.getByRole('tab', { name: 'Records' })
    expect(wellnessTab).toHaveAttribute('aria-selected', 'true')
    expect(recordsTab).toHaveAttribute('aria-selected', 'false')

    fireEvent.click(recordsTab)

    expect(recordsTab).toHaveAttribute('aria-selected', 'true')
    expect(wellnessTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'trends-tab-records')
  })
})
