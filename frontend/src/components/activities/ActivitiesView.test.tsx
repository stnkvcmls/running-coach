import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import ActivitiesView from './ActivitiesView'
import type { ActivitySummary } from '../../api/types'

// Fixed in the distant past so grouping always falls into the "month" bucket
// (>8 ISO weeks old), independent of whatever date the test happens to run on.
function summary(overrides: Partial<ActivitySummary>): ActivitySummary {
  return {
    id: 1,
    garmin_id: null,
    activity_type: 'running',
    name: 'Run',
    started_at: '2020-01-15T07:00:00Z',
    duration_sec: 1800,
    distance_m: 5000,
    avg_hr: null,
    max_hr: null,
    avg_pace_min_km: null,
    calories: null,
    elevation_gain: null,
    ...overrides,
  }
}

function mockFetch(activities: ActivitySummary[]) {
  return vi.fn().mockImplementation((url: string) => {
    const u = new URL(url, 'http://localhost')
    const type = u.searchParams.get('type')
    const filtered = type ? activities.filter(a => a.activity_type === type) : activities
    return Promise.resolve({ ok: true, status: 200, json: async () => filtered })
  })
}

describe('ActivitiesView grouping and filters', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('groups activities by month with a count + distance total', async () => {
    vi.stubGlobal('fetch', mockFetch([
      summary({ id: 1, name: 'Easy Run', started_at: '2020-01-20T07:00:00Z', distance_m: 8000 }),
      summary({ id: 2, name: 'Long Run', started_at: '2020-01-10T07:00:00Z', distance_m: 21000 }),
    ]))

    renderWithProviders(<ActivitiesView />)

    expect(await screen.findByText('January 2020')).toBeInTheDocument()
    expect(screen.getByText('2 runs · 29.0 km')).toBeInTheDocument()
  })

  it('labels a mixed-sport group as "activities" rather than misreporting it as runs', async () => {
    vi.stubGlobal('fetch', mockFetch([
      summary({ id: 1, name: 'Easy Run', activity_type: 'running', started_at: '2020-01-20T07:00:00Z', distance_m: 8000 }),
      summary({ id: 2, name: 'Recovery Spin', activity_type: 'cycling', started_at: '2020-01-18T07:00:00Z', distance_m: 15000 }),
    ]))

    renderWithProviders(<ActivitiesView />)

    expect(await screen.findByText('2 activities · 23.0 km')).toBeInTheDocument()
  })

  it('adds a chip for an activity_type outside the fixed filter list, without dropping the fixed ones', async () => {
    vi.stubGlobal('fetch', mockFetch([
      summary({ id: 1, name: 'Strength', activity_type: 'strength_training', started_at: '2020-01-20T07:00:00Z' }),
    ]))

    renderWithProviders(<ActivitiesView />)

    const chip = await screen.findByRole('button', { name: 'Strength Training' })
    expect(chip).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Running' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks the active filter chip with aria-pressed', async () => {
    vi.stubGlobal('fetch', mockFetch([summary({ id: 1 })]))
    renderWithProviders(<ActivitiesView />)
    await screen.findByText('January 2020')

    screen.getByRole('button', { name: 'Running' }).click()
    expect(await screen.findByRole('button', { name: 'Running' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })
})
