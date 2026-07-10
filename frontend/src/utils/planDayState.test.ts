import { describe, it, expect } from 'vitest'
import { dayState } from './planDayState'
import type { TrainingPlanDay } from '../api/types'

function day(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 1,
    plan_id: 1,
    day_date: '2026-07-08',
    day_of_week: 'Wednesday',
    week_number: 1,
    workout_type: 'easy',
    target_distance_m: 8000,
    target_pace_min_km: null,
    target_pace_display: null,
    description: null,
    notes: null,
    week_theme: null,
    routine: null,
    fuelling_guidance: null,
    matched_activity_id: null,
    adherence_score: null,
    ...overrides,
  }
}

const TODAY = '2026-07-09'

describe('dayState', () => {
  it('is "rest" whenever workout_type is rest, regardless of date or match', () => {
    expect(dayState(day({ workout_type: 'rest', day_date: '2026-07-01' }), TODAY)).toBe('rest')
    expect(dayState(day({ workout_type: 'rest', day_date: TODAY }), TODAY)).toBe('rest')
    expect(dayState(day({ workout_type: 'rest', day_date: '2026-08-01' }), TODAY)).toBe('rest')
  })

  it('is "today" when day_date equals today, even with a matched activity', () => {
    expect(dayState(day({ day_date: TODAY, matched_activity_id: null }), TODAY)).toBe('today')
    expect(dayState(day({ day_date: TODAY, matched_activity_id: 5 }), TODAY)).toBe('today')
  })

  it('is "done" for a past day with a matched activity', () => {
    expect(dayState(day({ day_date: '2026-07-08', matched_activity_id: 42 }), TODAY)).toBe('done')
  })

  it('is "missed" for a past day with no matched activity', () => {
    expect(dayState(day({ day_date: '2026-07-08', matched_activity_id: null }), TODAY)).toBe('missed')
  })

  it('is "upcoming" for a future day regardless of match', () => {
    expect(dayState(day({ day_date: '2026-07-10', matched_activity_id: null }), TODAY)).toBe('upcoming')
    expect(dayState(day({ day_date: '2026-07-10', matched_activity_id: 9 }), TODAY)).toBe('upcoming')
  })
})
