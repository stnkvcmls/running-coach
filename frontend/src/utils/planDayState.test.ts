import { describe, it, expect } from 'vitest'
import { dayState, isWatchPushable } from './planDayState'
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
    matched_distance_m: null,
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

  it('is "today" when day_date equals today and nothing has matched yet', () => {
    expect(dayState(day({ day_date: TODAY, matched_activity_id: null }), TODAY)).toBe('today')
  })

  it('is "done" for today once the backend matched an activity to it', () => {
    expect(dayState(day({ day_date: TODAY, matched_activity_id: 5 }), TODAY)).toBe('done')
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

describe('isWatchPushable', () => {
  it('returns true only for structured run workout types', () => {
    expect(isWatchPushable('easy')).toBe(true)
    expect(isWatchPushable('long')).toBe(true)
    expect(isWatchPushable('tempo')).toBe(true)
    expect(isWatchPushable('interval')).toBe(true)
    expect(isWatchPushable('Easy')).toBe(true)
  })

  it('returns false for non-run and missing workout types', () => {
    expect(isWatchPushable('strength')).toBe(false)
    expect(isWatchPushable('cross')).toBe(false)
    expect(isWatchPushable('rest')).toBe(false)
    expect(isWatchPushable('race')).toBe(false)
    expect(isWatchPushable('')).toBe(false)
    expect(isWatchPushable(null)).toBe(false)
    expect(isWatchPushable(undefined)).toBe(false)
  })
})
