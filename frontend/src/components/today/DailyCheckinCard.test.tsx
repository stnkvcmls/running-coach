import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import DailyCheckinCard from './DailyCheckinCard'
import type { DailyCheckin } from '../../api/types'

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })
}

function tapRow(name: string): HTMLElement {
  return screen.getByText(name).closest('.checkin-row') as HTMLElement
}

describe('DailyCheckinCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the log button disabled until at least one scale is tapped', () => {
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)

    expect(screen.getByRole('button', { name: 'Log check-in' })).toBeDisabled()
    fireEvent.click(within(tapRow('Energy')).getByRole('button', { name: '4' }))
    expect(screen.getByRole('button', { name: 'Log check-in' })).toBeEnabled()
  })

  it('reveals the soreness note field only when soreness is tapped at 3 or below', () => {
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)

    expect(screen.queryByPlaceholderText(/where's it sore/i)).not.toBeInTheDocument()
    fireEvent.click(within(tapRow('Soreness')).getByRole('button', { name: '2' }))
    expect(screen.getByPlaceholderText(/where's it sore/i)).toBeInTheDocument()

    fireEvent.click(within(tapRow('Soreness')).getByRole('button', { name: '5' }))
    expect(screen.queryByPlaceholderText(/where's it sore/i)).not.toBeInTheDocument()
  })

  it('submits the tapped scales for the viewed date', async () => {
    const fetchMock = mockFetchOk({ date: '2026-07-09', soreness: null, energy: 4, mood: null, soreness_note: null })
    vi.stubGlobal('fetch', fetchMock)

    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)
    fireEvent.click(within(tapRow('Energy')).getByRole('button', { name: '4' }))
    fireEvent.click(screen.getByRole('button', { name: 'Log check-in' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/daily-checkin?date=2026-07-09',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ soreness: null, energy: 4, mood: null, soreness_note: null }),
        }),
      ),
    )
  })

  it('collapses to a one-line summary chip for an existing check-in and re-enters editing on tap', () => {
    const checkin: DailyCheckin = { date: '2026-07-09', soreness: 4, energy: 3, mood: 5, soreness_note: null }
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={checkin} />)

    const chip = screen.getByRole('button', { name: /feeling great.*low soreness.*edit/i })
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument()

    fireEvent.click(chip)
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
  })

  it('dismisses the card when Skip is clicked with no existing check-in', () => {
    const { container } = renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(container).toBeEmptyDOMElement()
  })
})
