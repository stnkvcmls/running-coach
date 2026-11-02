import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/test-utils'
import SyncStatusPill, { describeSyncAge } from './SyncStatusPill'
import { useSyncStatus } from '../../api/hooks'

vi.mock('../../api/hooks', () => ({
  useSyncStatus: vi.fn(),
}))

const mockedUseSyncStatus = vi.mocked(useSyncStatus)

const HOUR = 60 * 60 * 1000

/** ISO timestamp `ms` before now (plus a minute, so floor() lands on the intended hour). */
function ago(ms: number): string {
  return new Date(Date.now() - ms - 60_000).toISOString()
}

function renderWithSettingsRoute() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<SyncStatusPill />} />
      <Route path="/settings" element={<div>Settings Page</div>} />
    </Routes>,
  )
}

describe('SyncStatusPill', () => {
  it('renders nothing when the last sync is recent (ok state)', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'ok', lastSyncedAt: ago(1 * HOUR) })
    const { container } = renderWithProviders(<SyncStatusPill />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing at exactly the 6 h boundary', () => {
    mockedUseSyncStatus.mockReturnValue({
      status: 'ok',
      lastSyncedAt: new Date(Date.now() - 6 * HOUR + 5_000).toISOString(),
    })
    const { container } = renderWithProviders(<SyncStatusPill />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while no sync is recorded (or status is still loading)', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'ok', lastSyncedAt: null })
    const { container } = renderWithProviders(<SyncStatusPill />)

    expect(container).toBeEmptyDOMElement()
  })

  it('warns with the sync age once the last sync is over 6 h old, and taps through to Settings', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'ok', lastSyncedAt: ago(7 * HOUR) })
    renderWithSettingsRoute()

    const btn = screen.getByRole('button', { name: /last synced 7 hours ago/i })
    expect(btn).toHaveTextContent('Synced 7 h ago')
    expect(btn).toHaveClass('sync-pill-warn')

    fireEvent.click(btn)
    expect(screen.getByText('Settings Page')).toBeInTheDocument()
  })

  it('switches to days for syncs older than two days', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'ok', lastSyncedAt: ago(3 * 24 * HOUR) })
    renderWithProviders(<SyncStatusPill />)

    expect(screen.getByRole('button')).toHaveTextContent('Synced 3 d ago')
  })

  it('shows a spinner glyph with no interaction while syncing', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'syncing', lastSyncedAt: null })
    renderWithProviders(<SyncStatusPill />)

    expect(screen.getByRole('status', { name: /syncing/i })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('warns and navigates to Settings when Garmin needs reauth', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'needs_reauth', lastSyncedAt: ago(1 * HOUR) })
    renderWithSettingsRoute()

    const btn = screen.getByRole('button', { name: /reconnect/i })
    expect(btn).toHaveClass('sync-pill-warn')

    fireEvent.click(btn)
    expect(screen.getByText('Settings Page')).toBeInTheDocument()
  })
})

describe('describeSyncAge', () => {
  it('uses whole hours under two days and whole days after', () => {
    expect(describeSyncAge(6.5 * HOUR)).toEqual({ short: '6 h', long: '6 hours' })
    expect(describeSyncAge(47.9 * HOUR)).toEqual({ short: '47 h', long: '47 hours' })
    expect(describeSyncAge(48 * HOUR)).toEqual({ short: '2 d', long: '2 days' })
    expect(describeSyncAge(80 * HOUR)).toEqual({ short: '3 d', long: '3 days' })
  })
})
