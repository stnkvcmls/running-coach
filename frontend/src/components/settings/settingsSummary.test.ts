import { describe, it, expect } from 'vitest'
import type {
  AthleteProfile,
  CoachMemory,
  NotificationPreferencesResponse,
  SystemHealthResponse,
} from '../../api/types'
import {
  formatSyncTime,
  garminSummary,
  healthSummary,
  memorySummary,
  notificationsSummary,
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
    const h = (o: Partial<SystemHealthResponse>): SystemHealthResponse => ({
      last_sync: {},
      canary_ok: true,
      canary: {},
      recent_failed_jobs: [],
      garmin_connected: true,
      garmin_needs_reauth: false,
      push_configured: true,
      push_subscriptions: 1,
      stuck_jobs: 0,
      ...o,
    })
    expect(healthSummary(undefined)).toBeNull()
    expect(healthSummary(h({}))).toEqual({ text: 'All checks pass', tone: 'ok' })
    expect(healthSummary(h({ garmin_needs_reauth: true, garmin_connected: false, canary_ok: false }))).toEqual({
      text: 'Garmin reconnect needed',
      tone: 'warn',
    })
    expect(healthSummary(h({ garmin_connected: false, canary_ok: false }))).toEqual({
      text: 'Garmin not connected',
      tone: 'warn',
    })
    expect(healthSummary(h({ canary_ok: false }))).toEqual({ text: 'Schema drift', tone: 'warn' })
    expect(
      healthSummary(h({ recent_failed_jobs: [{}] as SystemHealthResponse['recent_failed_jobs'], stuck_jobs: 2 })),
    ).toEqual({ text: '1 failed job', tone: 'warn' })
    expect(
      healthSummary(h({ recent_failed_jobs: [{}, {}] as SystemHealthResponse['recent_failed_jobs'] })),
    ).toEqual({ text: '2 failed jobs', tone: 'warn' })
    expect(healthSummary(h({ stuck_jobs: 1 }))).toEqual({ text: '1 stuck job', tone: 'warn' })
    expect(healthSummary(h({ stuck_jobs: 3 }))).toEqual({ text: '3 stuck jobs', tone: 'warn' })
  })

  it('summarises notification preferences', () => {
    const p = (o: Partial<NotificationPreferencesResponse>): NotificationPreferencesResponse => ({
      categories: { insight: true, review: false, race: true },
      labels: { insight: 'Insights', review: 'Weekly review', race: 'Race reminders' },
      push_configured: true,
      push_subscriptions: 1,
      ...o,
    })
    expect(notificationsSummary(undefined)).toBeNull()
    expect(notificationsSummary(p({ push_configured: false, push_subscriptions: 0 }))).toBe('Not set up on server')
    expect(notificationsSummary(p({ push_configured: true, push_subscriptions: 0 }))).toBe('Off on all devices')
    expect(notificationsSummary(p({}))).toBe('2 of 3 on')
  })
})
