import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/test-utils'
import { format } from '../../utils/date'
import SyncStatusPill from './SyncStatusPill'
import { useSyncStatus } from '../../api/hooks'

vi.mock('../../api/hooks', () => ({
  useSyncStatus: vi.fn(),
}))

const mockedUseSyncStatus = vi.mocked(useSyncStatus)

describe('SyncStatusPill', () => {
  it('shows a check icon and reveals the last-sync time on tap (ok state)', () => {
    const lastSyncedAt = '2026-07-09T12:04:00Z'
    mockedUseSyncStatus.mockReturnValue({ status: 'ok', lastSyncedAt })
    renderWithProviders(<SyncStatusPill />)

    const expectedTime = format(new Date(lastSyncedAt), 'HH:mm')
    expect(screen.queryByText(expectedTime)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(expectedTime)).toBeInTheDocument()
  })

  it('shows a spinner glyph with no interaction while syncing', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'syncing', lastSyncedAt: null })
    renderWithProviders(<SyncStatusPill />)

    expect(screen.getByRole('status', { name: /syncing/i })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('warns and navigates to Settings when Garmin needs reauth', () => {
    mockedUseSyncStatus.mockReturnValue({ status: 'needs_reauth', lastSyncedAt: null })
    renderWithProviders(
      <Routes>
        <Route path="/" element={<SyncStatusPill />} />
        <Route path="/settings" element={<div>Settings Page</div>} />
      </Routes>,
    )

    const btn = screen.getByRole('button', { name: /reconnect/i })
    expect(btn).toHaveClass('sync-pill-warn')

    fireEvent.click(btn)
    expect(screen.getByText('Settings Page')).toBeInTheDocument()
  })
})
