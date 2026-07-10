import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import ActivityListItem from './ActivityListItem'
import type { ActivitySummary } from '../../api/types'
import { SPORT_COLORS, colorMap } from '../../utils/colors'

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

function activity(overrides: Partial<ActivitySummary> = {}): ActivitySummary {
  return {
    id: 42,
    garmin_id: null,
    activity_type: 'running',
    name: 'Tempo Run',
    started_at: '2026-07-08T07:12:00Z',
    duration_sec: 3492,
    distance_m: 12400,
    avg_hr: 152,
    max_hr: 171,
    avg_pace_min_km: 4.68,
    calories: 748,
    elevation_gain: 84,
    ...overrides,
  }
}

describe('ActivityListItem', () => {
  it('renders as a focusable link with an accessible name that navigates to the activity', () => {
    renderWithProviders(<ActivityListItem activity={activity()} />)

    const link = screen.getByRole('link', { name: /Tempo Run/ })
    expect(link).toHaveAttribute('href', '/activities/42')

    link.focus()
    expect(link).toHaveFocus()
  })

  it('shows a Workout tag when workout_tag is set', () => {
    renderWithProviders(<ActivityListItem activity={activity({ workout_tag: 'Tempo Run' })} />)
    expect(screen.getByText('Workout')).toBeInTheDocument()
  })

  it('omits the Workout tag when workout_tag is absent', () => {
    renderWithProviders(<ActivityListItem activity={activity()} />)
    expect(screen.queryByText('Workout')).not.toBeInTheDocument()
  })

  it('falls back to "Workout" when the activity has no name', () => {
    renderWithProviders(<ActivityListItem activity={activity({ name: null })} />)
    expect(screen.getByRole('link', { name: /Workout/ })).toBeInTheDocument()
  })

  it('tints the icon by sport colour for a non-running activity', () => {
    const { container } = renderWithProviders(
      <ActivityListItem activity={activity({ name: 'Morning Ride', activity_type: 'cycling' })} />,
    )
    const icon = container.querySelector('.ali-icon') as HTMLElement
    // jsdom normalizes inline hex colours to rgb() on readback.
    expect(icon.style.color).toBe(hexToRgb(SPORT_COLORS.bike))
  })

  it('tints the icon by workout intensity for a running activity', () => {
    const { container } = renderWithProviders(
      <ActivityListItem activity={activity({ name: 'Interval Session', activity_type: 'running' })} />,
    )
    const icon = container.querySelector('.ali-icon') as HTMLElement
    expect(icon.style.color).toBe(hexToRgb(colorMap.interval))
  })

  it('appends avg HR to the meta line when present', () => {
    renderWithProviders(<ActivityListItem activity={activity({ avg_hr: 152 })} />)
    expect(screen.getByText(/152/)).toBeInTheDocument()
  })

  it('omits the HR segment when avg_hr is absent', () => {
    const { container } = renderWithProviders(<ActivityListItem activity={activity({ avg_hr: null })} />)
    expect(container.querySelector('.ali-meta')?.textContent).not.toMatch(/♥/)
  })

  it('shows a PB badge when the activity carries personal records', () => {
    renderWithProviders(<ActivityListItem activity={activity({
      personal_records: [{
        id: 1, record_type: 'distance', metric: null, duration_sec: null, distance_label: '5K',
        value: 1200, previous_value: null, activity_id: 42, achieved_at: '2026-07-08T07:12:00Z',
        label: '5K', display_value: '19:42',
      }],
    })} />)
    expect(screen.getByText('PB')).toBeInTheDocument()
  })

  it('omits the PB badge when there are no personal records', () => {
    renderWithProviders(<ActivityListItem activity={activity({ personal_records: null })} />)
    expect(screen.queryByText('PB')).not.toBeInTheDocument()
  })
})
