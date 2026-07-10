import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import ActivityListItem from './ActivityListItem'
import type { ActivitySummary } from '../../api/types'

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
})
