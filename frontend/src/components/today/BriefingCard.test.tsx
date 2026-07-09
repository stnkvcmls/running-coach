import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import BriefingCard from './BriefingCard'
import type { InsightResponse } from '../../api/types'

function mockFetch() {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === 'POST' && url.includes('/briefing')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ status: 'ok', job_id: 5 }) })
    }
    if (url.includes('/jobs/5')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          id: 5,
          task_type: 'generate_briefing',
          status: 'done',
          attempts: 1,
          max_attempts: 3,
          error_message: null,
          created_at: null,
          started_at: null,
          completed_at: null,
        }),
      })
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
  })
}

describe('BriefingCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing when there is no plan day for the viewed date', () => {
    vi.stubGlobal('fetch', mockFetch())
    const { container } = renderWithQueryClient(
      <BriefingCard dateKey="2026-07-09" planDayId={null} briefing={null} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('offers to generate a briefing and kicks off the job on click', async () => {
    const fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)

    renderWithQueryClient(<BriefingCard dateKey="2026-07-09" planDayId={12} briefing={null} />)
    expect(screen.getByText(/get a short pre-workout note/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /generate briefing/i }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/training-plan/days/12/briefing',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
  })

  it('renders an existing briefing with a regenerate control', () => {
    vi.stubGlobal('fetch', mockFetch())
    const briefing: InsightResponse = {
      id: 1,
      created_at: '2026-07-09T06:00:00Z',
      trigger_type: 'plan_day',
      trigger_id: 12,
      content: 'Todays session is an easy 8k — run it conversational.',
      summary: null,
      category: 'briefing',
    }
    renderWithQueryClient(<BriefingCard dateKey="2026-07-09" planDayId={12} briefing={briefing} />)

    expect(screen.getByText("Today's Briefing")).toBeInTheDocument()
    expect(screen.getByText(/run it conversational/)).toBeInTheDocument()
    expect(screen.getByTitle('Regenerate briefing')).toBeInTheDocument()
  })
})
