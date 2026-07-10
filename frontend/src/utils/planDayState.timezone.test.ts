// No @types/node in this project (frontend has zero Node-typed runtime code),
// so declare just enough of the global to set TZ below without adding a dep.
declare const process: { env: Record<string, string | undefined> }

// Must run before any Date is constructed in this module graph — Node reads
// process.env.TZ lazily but locks it in on first use, so this has to be the
// very first statement in the file, ahead of every import.
const ORIGINAL_TZ = process.env.TZ
process.env.TZ = 'Europe/Amsterdam'

import { describe, it, expect, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { todayStr, dayState } from './planDayState'
import type { TrainingPlanDay } from '../api/types'

function day(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 1,
    plan_id: 1,
    day_date: '2026-07-11',
    day_of_week: 'Saturday',
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

// 2026-07-10T22:30:00Z is 2026-07-11T00:30 local time in Amsterdam (CEST,
// UTC+2 in July) — UTC and local calendars disagree about "today" here.
const UTC_LATE_LOCAL_MIDNIGHT = new Date('2026-07-10T22:30:00Z')

describe('todayStr / dayState at the UTC-vs-local midnight boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(UTC_LATE_LOCAL_MIDNIGHT)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  afterAll(() => {
    process.env.TZ = ORIGINAL_TZ
  })

  it('todayStr() returns the local date, not the UTC date', () => {
    expect(todayStr()).toBe('2026-07-11')
  })

  it('dayState() marks the local-today plan day as "today", not "upcoming"', () => {
    expect(dayState(day({ day_date: '2026-07-11' }))).toBe('today')
  })
})
