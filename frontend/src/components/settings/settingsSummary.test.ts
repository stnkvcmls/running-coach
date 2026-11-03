import { describe, it, expect } from 'vitest'
import type { AthleteProfile, CoachMemory, SystemHealthResponse } from '../../api/types'
import {
  formatSyncTime,
  garminSummary,
  healthSummary,
  memorySummary,
  profileSummary,
  thresholdsSummary,
} from './settingsSummary'

const profile = (p: Partial<AthleteProfile>) => p as AthleteProfile

describe('settings index summaries', () => {
  it('omits missing profile parts instead of showing blanks', () => {
    expect(profileSummary(profile({ name: 'Alex', age: 36 }))).toBe('Alex, 36')
    expect(profileSummary(profile({ name: null, age: 36 }))).toBe('36')
    expect(profileSummary(profile({ name: null, age: null }))).toBeNull()
    expect(thresholdsSummary(profile({ threshold_pace_min_km: 4.3, threshold_hr: null }))).toBe('4:18 /km')
    expect(thresholdsSummary(profile({ threshold_pace_min_km: null, threshold_hr: null }))).toBeNull()
  })

  it('shows a clock time for a sync today and a date for an older one', () => {
    const now = new Date(2026, 10, 3, 20, 0)
    expect(formatSyncTime(new Date(2026, 10, 3, 8, 5).toISOString(), now)).toBe('08:05')
    expect(formatSyncTime(new Date(2026, 10, 1, 8, 5).toISOString(), now)).not.toMatch(/^\d\d:\d\d$/)
  })

  it('describes the Garmin connection state', () => {
    const base = { connected: true, garmin_email: null, mfa_pending: false, needs_reauth: false }
    const now = new Date(2026, 10, 3, 20, 0)
    expect(garminSummary(undefined, null)).toBeNull()
    expect(garminSummary({ ...base, needs_reauth: true }, null)).toEqual({ text: 'Reconnect needed', tone: 'warn' })
    expect(garminSummary({ ...base, connected: false }, null)).toEqual({ text: 'Not connected' })
    expect(garminSummary(base, new Date(2026, 10, 3, 18, 12).toISOString(), now)).toEqual({ text: 'Synced 18:12', tone: 'ok' })
  })

  it('counts active coach memories', () => {
    const m = (active: boolean) => ({ active }) as CoachMemory
    expect(memorySummary([])).toBe('None yet')
    expect(memorySummary([m(true), m(false), m(true)])).toBe('2 active')
  })

  it('summarises system health', () => {
    const h = (o: Partial<SystemHealthResponse>): SystemHealthResponse =>
      ({ last_sync: {}, canary_ok: true, canary: {}, recent_failed_jobs: [], ...o })
    expect(healthSummary(h({}))).toEqual({ text: 'All checks pass', tone: 'ok' })
    expect(healthSummary(h({ canary_ok: false }))?.text).toBe('Schema drift')
    expect(healthSummary(h({ recent_failed_jobs: [{}] as SystemHealthResponse['recent_failed_jobs'] }))?.text).toBe('1 failed job')
  })
})
