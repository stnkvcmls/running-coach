import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeContext } from '../../App'
import SettingsView from './SettingsView'
import SettingsSectionView from './SettingsSectionView'

const RESPONSES: Record<string, unknown> = {
  '/me': { email: 'dev@localhost' },
  '/athlete-profile': { id: 1, name: 'Alex', age: 36, threshold_pace_min_km: 4.3, threshold_hr: 170 },
  '/garmin-credentials/status': { connected: true, garmin_email: 'a@b.c', mfa_pending: false, needs_reauth: false },
  '/health-detail': {
    last_sync: { activities: new Date(2026, 10, 3, 18, 12).toISOString(), daily: null },
    canary_ok: true,
    canary: {},
    recent_failed_jobs: [],
  },
  '/coach-memory': [],
  '/notification-preferences': {
    categories: { insight: true, review: false },
    labels: { insight: 'Insights', review: 'Weekly review', race: 'Race reminders' },
  },
  '/ai-config': { provider: 'claude', model: 'claude-sonnet', available_providers: ['claude'], available_models: { claude: ['claude-sonnet'] } },
  '/settings': { counts: { activities: 12 } },
}

function stubApi(overrides: Record<string, unknown> = {}) {
  const responses = { ...RESPONSES, ...overrides }
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    const path = Object.keys(responses).find(p => url.endsWith(p))
    const body = path ? responses[path] : {}
    return Promise.resolve({ ok: true, status: 200, json: async () => body })
  }))
}

function renderAt(route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme: 'dark', preference: 'system', setPreference: vi.fn() }}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/settings/:section" element={<SettingsSectionView />} />
          </Routes>
        </MemoryRouter>
      </ThemeContext.Provider>
    </QueryClientProvider>,
  )
}

function row(label: string) {
  return screen.getByText(label).closest('a') as HTMLAnchorElement
}

describe('SettingsView index', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists the five groups with each row showing its current value', async () => {
    stubApi()
    renderAt('/settings')

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    for (const group of ['You', 'Connections', 'Coach', 'App', 'Data']) {
      expect(screen.getByRole('heading', { name: group })).toBeInTheDocument()
    }

    expect(await within(row('Athlete profile')).findByText('Alex, 36')).toBeInTheDocument()
    expect(within(row('Zones and thresholds')).getByText('4:18 /km, 170 bpm')).toBeInTheDocument()
    expect(await within(row('Garmin Connect')).findByText(/^Synced /)).toBeInTheDocument()
    expect(await within(row('What the coach remembers')).findByText('None yet')).toBeInTheDocument()
    expect(await within(row('Notifications')).findByText('2 of 3 on')).toBeInTheDocument()
    expect(await within(row('AI model')).findByText('claude-sonnet')).toBeInTheDocument()
    expect(within(row('Appearance')).getByText('System')).toBeInTheDocument()
    expect(within(row('Export')).getByText('CSV, JSON')).toBeInTheDocument()
    expect(await within(row('System health')).findByText('All checks pass')).toBeInTheDocument()
    expect(await screen.findByText('Signed in as dev@localhost')).toBeInTheDocument()
  })

  it('links each row to its sub-page', () => {
    stubApi()
    renderAt('/settings')

    expect(row('Athlete profile')).toHaveAttribute('href', '/settings/profile')
    expect(row('Zones and thresholds')).toHaveAttribute('href', '/settings/zones')
    expect(row('Garmin Connect')).toHaveAttribute('href', '/settings/garmin')
    expect(row('What the coach remembers')).toHaveAttribute('href', '/settings/coach')
    expect(row('Notifications')).toHaveAttribute('href', '/settings/notifications')
    expect(row('AI model')).toHaveAttribute('href', '/settings/coach')
    expect(row('Appearance')).toHaveAttribute('href', '/settings/appearance')
    expect(row('Sync now')).toHaveAttribute('href', '/settings/garmin')
    expect(row('Export')).toHaveAttribute('href', '/settings/data')
    expect(row('System health')).toHaveAttribute('href', '/settings/data')
  })

  it('flags a Garmin session that needs reconnecting', async () => {
    stubApi({ '/garmin-credentials/status': { connected: true, garmin_email: 'a@b.c', mfa_pending: false, needs_reauth: true } })
    renderAt('/settings')

    expect(await within(row('Garmin Connect')).findByText('Reconnect needed')).toBeInTheDocument()
  })

  it('opens a sub-page from a row and comes back via the header', async () => {
    stubApi()
    renderAt('/settings')

    fireEvent.click(row('Appearance'))
    expect(screen.getByRole('heading', { level: 1, name: 'Appearance' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
  })

  it('renders the moved sections on their sub-pages', async () => {
    stubApi()
    renderAt('/settings/data')

    expect(screen.getByRole('heading', { level: 1, name: 'Data' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Data export' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Database' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'System health' })).toBeInTheDocument()
  })

  it('sends an unknown section back to the index', () => {
    stubApi()
    renderAt('/settings/nope')

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
  })
})
