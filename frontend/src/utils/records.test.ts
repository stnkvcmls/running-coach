import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isRecentRecord, celebrateNewRecords } from './records'
import { toast } from '../components/ui/Toast'
import type { PersonalRecordResponse } from '../api/types'

vi.mock('../components/ui/Toast', () => ({ toast: vi.fn() }))

const NOW = new Date('2026-07-10T12:00:00Z')
const DAY_MS = 24 * 60 * 60 * 1000

function record(overrides: Partial<PersonalRecordResponse> = {}): PersonalRecordResponse {
  return {
    id: 1,
    record_type: 'distance',
    metric: null,
    duration_sec: null,
    distance_label: '5K',
    value: 1182,
    previous_value: null,
    activity_id: 42,
    achieved_at: NOW.toISOString(),
    label: '5K',
    display_value: '19:42',
    ...overrides,
  }
}

describe('isRecentRecord', () => {
  it('is true exactly at the 7-day boundary', () => {
    const achieved = new Date(NOW.getTime() - 7 * DAY_MS).toISOString()
    expect(isRecentRecord(achieved, NOW)).toBe(true)
  })

  it('is false just past the 7-day boundary', () => {
    const achieved = new Date(NOW.getTime() - 7 * DAY_MS - 1).toISOString()
    expect(isRecentRecord(achieved, NOW)).toBe(false)
  })

  it('is true for a record achieved this instant', () => {
    expect(isRecentRecord(NOW.toISOString(), NOW)).toBe(true)
  })

  it('is false for a future-dated record (clock skew guard)', () => {
    const achieved = new Date(NOW.getTime() + DAY_MS).toISOString()
    expect(isRecentRecord(achieved, NOW)).toBe(false)
  })
})

describe('celebrateNewRecords', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(toast).mockClear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ignores records older than 7 days', () => {
    celebrateNewRecords([record({ id: 1, achieved_at: new Date(NOW.getTime() - 30 * DAY_MS).toISOString() })])
    expect(toast).not.toHaveBeenCalled()
  })

  it('toasts a recent record once', () => {
    celebrateNewRecords([record({ id: 2, label: '5K', display_value: '19:42' })])
    expect(toast).toHaveBeenCalledTimes(1)
    expect(toast).toHaveBeenCalledWith('🏆 New 5K best — 19:42', { kind: 'success' })
  })

  it('does not re-toast the same record id on a later call', () => {
    const r = record({ id: 3 })
    celebrateNewRecords([r])
    celebrateNewRecords([r])
    expect(toast).toHaveBeenCalledTimes(1)
  })

  it('skips null/undefined entries and handles an empty/null list', () => {
    expect(() => celebrateNewRecords(null)).not.toThrow()
    expect(() => celebrateNewRecords([null, undefined])).not.toThrow()
    expect(toast).not.toHaveBeenCalled()
  })
})
