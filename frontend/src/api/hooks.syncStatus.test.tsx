import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSyncStatus } from './hooks'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function mockFetch(garminOverrides: { needs_reauth: boolean }) {
  return vi.fn((url: string) => {
    if (url.includes('/health-detail')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          last_sync: { garmin: '2026-07-10T08:00:00Z' },
          canary_ok: true,
          canary: {},
          recent_failed_jobs: [],
        }),
      })
    }
    if (url.includes('/garmin-credentials/status')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ connected: true, garmin_email: 'a@b.com', mfa_pending: false, ...garminOverrides }),
      })
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`))
  })
}

describe('useSyncStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('never reports "syncing" from its own background poll, mid-flight or resolved', async () => {
    vi.stubGlobal('fetch', mockFetch({ needs_reauth: false }))

    const { result } = renderHook(() => useSyncStatus(), { wrapper })

    // Immediately after mount the query is still fetching (isFetching would
    // have been true here) — this used to leak into the pill as "syncing".
    expect(result.current.status).toBe('ok')

    await waitFor(() => expect(result.current.lastSyncedAt).not.toBeNull())
    expect(result.current.status).toBe('ok')
  })

  it('reports "needs_reauth" when Garmin needs reconnecting, never "syncing"', async () => {
    vi.stubGlobal('fetch', mockFetch({ needs_reauth: true }))

    const { result } = renderHook(() => useSyncStatus(), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('needs_reauth'))
  })
})
