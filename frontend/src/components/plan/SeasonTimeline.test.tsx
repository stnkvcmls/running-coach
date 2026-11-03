import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import SeasonTimeline from './SeasonTimeline'
import type { SeasonPlanResponse } from '../../api/types'

const season: SeasonPlanResponse = {
  id: 1,
  generated_at: '2026-06-01T00:00:00Z',
  start_date: '2026-06-01',
  goal_race_title: 'Berlin Marathon',
  goal_race_date: '2026-07-26',
  goal_race_distance_m: 42195,
  peak_weekly_km: 80,
  weeks: [
    { week_number: 1, week_start: '2026-06-01', phase: 'base', target_weekly_km: 50, notes: null },
    { week_number: 2, week_start: '2026-06-08', phase: 'base', target_weekly_km: 55, notes: null },
    { week_number: 3, week_start: '2026-06-15', phase: 'build', target_weekly_km: 60, notes: null },
    { week_number: 4, week_start: '2026-06-22', phase: 'build', target_weekly_km: 65, notes: null },
    { week_number: 5, week_start: '2026-06-29', phase: 'peak', target_weekly_km: 70, notes: null },
    { week_number: 6, week_start: '2026-07-06', phase: 'taper', target_weekly_km: 40, notes: null },
    { week_number: 7, week_start: '2026-07-13', phase: 'race', target_weekly_km: 30, notes: null },
  ],
}

describe('SeasonTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-06-17T12:00:00'))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => season }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('draws one segment per phase run with the current one marked and the summary under it', async () => {
    renderWithProviders(<SeasonTimeline summary="Four weeks of controlled tempo volume." />)

    const ribbon = await screen.findByRole('img', { name: /season/i })
    expect(ribbon).toHaveAccessibleName(
      'Season: Base 2 weeks, done; Build 2 weeks, current; Peak 1 week; Taper 1 week; Race 1 week',
    )
    expect(ribbon.querySelectorAll('.season-ribbon-seg--past')).toHaveLength(1)
    expect(ribbon.querySelectorAll('.season-ribbon-seg--current')).toHaveLength(1)
    expect(ribbon.querySelectorAll('.season-ribbon-seg--future')).toHaveLength(3)
    // Week 3 of 7 is current: the caret sits over its middle.
    expect(screen.getByTestId('season-here').style.left).toBe(`${(2.5 / 7) * 100}%`)
    expect(screen.getByText('Build')).toHaveClass('season-ribbon-label--current')
    expect(screen.getByText('Four weeks of controlled tempo volume.')).toBeInTheDocument()
  })
})
