import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import DailyCheckinCard from './DailyCheckinCard'
import type { DailyCheckin } from '../../api/types'

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })
}

function scale(name: string): HTMLElement {
  return screen.getByRole('group', { name: new RegExp(`^${name}`) })
}

function tap(name: string, value: number) {
  fireEvent.click(within(scale(name)).getByRole('button', { name: String(value) }))
}

describe('DailyCheckinCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders one joined 1–5 control per question with end labels and no Log button', () => {
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)

    for (const name of ['Soreness', 'Energy', 'Mood']) {
      expect(within(scale(name)).getAllByRole('button')).toHaveLength(5)
    }
    expect(screen.getByText('Very sore')).toBeInTheDocument()
    expect(screen.getByText('Great')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /log check-in/i })).not.toBeInTheDocument()
  })

  it('marks the picked segment pressed and does not save until all three are set', () => {
    const fetchMock = mockFetchOk({})
    vi.stubGlobal('fetch', fetchMock)
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)

    tap('Energy', 4)
    tap('Mood', 5)
    expect(within(scale('Energy')).getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('auto-saves for the viewed date once the third answer is in', async () => {
    const fetchMock = mockFetchOk({ date: '2026-07-09', soreness: 4, energy: 4, mood: 5, soreness_note: null })
    vi.stubGlobal('fetch', fetchMock)
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)

    tap('Soreness', 4)
    tap('Energy', 4)
    tap('Mood', 5)

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/daily-checkin?date=2026-07-09',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ soreness: 4, energy: 4, mood: 5, soreness_note: null }),
        }),
      ),
    )
  })

  it('reveals the soreness note at 3 or below and keeps the card open after saving for it', async () => {
    const fetchMock = mockFetchOk({})
    vi.stubGlobal('fetch', fetchMock)
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)

    expect(screen.queryByPlaceholderText(/where's it sore/i)).not.toBeInTheDocument()
    tap('Soreness', 2)
    expect(screen.getByPlaceholderText(/where's it sore/i)).toBeInTheDocument()
    tap('Energy', 3)
    tap('Mood', 3)

    expect(await screen.findByRole('button', { name: 'Done' })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText(/where's it sore/i), { target: { value: 'left knee' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/v1/daily-checkin?date=2026-07-09',
        expect.objectContaining({ body: JSON.stringify({ soreness: 2, energy: 3, mood: 3, soreness_note: 'left knee' }) }),
      ),
    )
  })

  it('collapses to a one-line summary for an existing check-in and re-opens on tap', () => {
    const checkin: DailyCheckin = { date: '2026-07-09', soreness: 4, energy: 3, mood: 5, soreness_note: null }
    renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={checkin} />)

    const chip = screen.getByRole('button', { name: /feeling great.*low soreness.*edit/i })
    expect(screen.queryByRole('group')).not.toBeInTheDocument()

    fireEvent.click(chip)
    expect(within(scale('Mood')).getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('dismisses the card when Skip is clicked with no existing check-in', () => {
    const { container } = renderWithQueryClient(<DailyCheckinCard date="2026-07-09" checkin={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(container).toBeEmptyDOMElement()
  })
})
