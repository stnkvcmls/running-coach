import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import SystemHealthSection from './SystemHealthSection'
import type { SystemHealthResponse } from '../../api/types'

function health(overrides: Partial<SystemHealthResponse> = {}): SystemHealthResponse {
  return {
    last_sync: { activities: '2026-07-08T07:00:00Z', daily: null, profile: null, calendar: null },
    canary_ok: true,
    canary: {},
    recent_failed_jobs: [],
    ...overrides,
  }
}

function mockFetch(body: SystemHealthResponse) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === 'POST' && url.includes('/retry')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 1, status: 'pending' }) })
    }
    if (url.includes('/health-detail')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => body })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
  })
}

describe('SystemHealthSection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing before the health data has loaded', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    const { container } = renderWithQueryClient(<SystemHealthSection />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "never" for sync jobs with no recorded timestamp', async () => {
    vi.stubGlobal('fetch', mockFetch(health()))
    renderWithQueryClient(<SystemHealthSection />)

    await screen.findByText('Last sync')
    expect(screen.getByText('Daily summary').nextSibling).toHaveTextContent('never')
    expect(screen.getByText('Activities').nextSibling).not.toHaveTextContent('never')
  })

  it('shows an all-OK status line when the canary has no drift', async () => {
    vi.stubGlobal('fetch', mockFetch(health({ canary_ok: true })))
    renderWithQueryClient(<SystemHealthSection />)

    expect(await screen.findByText('All contracts OK')).toBeInTheDocument()
    expect(screen.queryByText('Schema drift detected')).not.toBeInTheDocument()
  })

  it('lists drifted sources and their missing fields when the canary alarms', async () => {
    vi.stubGlobal('fetch', mockFetch(health({
      canary_ok: false,
      canary: {
        activity_summary: { ok: false, missing: ['activityId'], checked_at: '2026-07-08T07:00:00Z' },
        daily_stats: { ok: true, missing: [], checked_at: '2026-07-08T07:00:00Z' },
      },
    })))
    renderWithQueryClient(<SystemHealthSection />)

    expect(await screen.findByText('Schema drift detected')).toBeInTheDocument()
    const sourceEl = screen.getByText('activity_summary')
    expect(sourceEl.closest('li')).toHaveTextContent('missing activityId')
    expect(screen.queryByText('daily_stats')).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no failed jobs', async () => {
    vi.stubGlobal('fetch', mockFetch(health({ recent_failed_jobs: [] })))
    renderWithQueryClient(<SystemHealthSection />)
    expect(await screen.findByText('No failed jobs.')).toBeInTheDocument()
  })

  it('lists failed jobs with attempts/error and a retry button', async () => {
    vi.stubGlobal('fetch', mockFetch(health({
      recent_failed_jobs: [{
        id: 7,
        task_type: 'generate_plan',
        status: 'failed',
        attempts: 3,
        max_attempts: 3,
        error_message: 'boom',
        created_at: null,
        started_at: null,
        completed_at: null,
      }],
    })))
    renderWithQueryClient(<SystemHealthSection />)

    const taskEl = await screen.findByText('generate_plan')
    expect(taskEl.closest('li')).toHaveTextContent('3/3 attempts — boom')
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('posts to the retry endpoint for that job when Retry is clicked', async () => {
    const fetchMock = mockFetch(health({
      recent_failed_jobs: [{
        id: 7,
        task_type: 'generate_plan',
        status: 'failed',
        attempts: 3,
        max_attempts: 3,
        error_message: 'boom',
        created_at: null,
        started_at: null,
        completed_at: null,
      }],
    }))
    vi.stubGlobal('fetch', fetchMock)
    renderWithQueryClient(<SystemHealthSection />)

    fireEvent.click(await screen.findByRole('button', { name: /retry/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/jobs/7/retry',
      expect.objectContaining({ method: 'POST' }),
    ))
  })

  it('disables the retry button while the retry mutation is in flight', async () => {
    const fetchMock = mockFetch(health({
      recent_failed_jobs: [{
        id: 7,
        task_type: 'generate_plan',
        status: 'failed',
        attempts: 3,
        max_attempts: 3,
        error_message: 'boom',
        created_at: null,
        started_at: null,
        completed_at: null,
      }],
    }))
    let resolveRetry: (v: unknown) => void = () => {}
    const pendingRetry = new Promise(resolve => { resolveRetry = resolve })
    const patchedFetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/retry')) return pendingRetry
      return fetchMock(url, init)
    })
    vi.stubGlobal('fetch', patchedFetch)

    renderWithQueryClient(<SystemHealthSection />)
    fireEvent.click(await screen.findByRole('button', { name: /retry/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /retrying/i })).toBeDisabled())
    resolveRetry({ ok: true, status: 200, json: async () => ({ id: 7, status: 'pending' }) })
  })
})
