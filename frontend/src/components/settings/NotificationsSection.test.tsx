import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import NotificationsSection from './NotificationsSection'

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (url.includes('/push/vapid-public-key')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ public_key: 'test-key', configured: true }),
        })
      }
      if (url.includes('/notification-preferences')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            categories: { insight: true },
            labels: { insight: 'New coaching insights' },
            push_configured: true,
            push_subscriptions: 0,
          }),
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    }),
  )
}

describe('NotificationsSection', () => {
  const originalSwDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
  const originalPushManager = (window as unknown as Record<string, unknown>).PushManager

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalSwDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', originalSwDescriptor)
    } else {
      delete (navigator as unknown as Record<string, unknown>).serviceWorker
    }
    if (originalPushManager !== undefined) {
      Object.defineProperty(window, 'PushManager', {
        value: originalPushManager,
        configurable: true,
        writable: true,
      })
    } else {
      delete (window as unknown as Record<string, unknown>).PushManager
    }
  })

  it('shows a message and no Enable button when no service worker is registered', async () => {
    mockFetch()
    Object.defineProperty(window, 'PushManager', {
      value: function PushManager() {},
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })

    renderWithQueryClient(<NotificationsSection />)

    expect(
      await screen.findByText('Notifications need the installed app (service worker not active).'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument()
  })

  it('shows the Enable button when a service worker is registered without a subscription', async () => {
    mockFetch()
    Object.defineProperty(window, 'PushManager', {
      value: function PushManager() {},
      configurable: true,
      writable: true,
    })
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(null) },
        }),
      },
      configurable: true,
    })

    renderWithQueryClient(<NotificationsSection />)

    expect(await screen.findByRole('button', { name: /enable notifications/i })).toBeInTheDocument()
    expect(
      screen.queryByText('Notifications need the installed app (service worker not active).'),
    ).not.toBeInTheDocument()
  })
})
