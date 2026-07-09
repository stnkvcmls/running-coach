import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithQueryClient } from '../../test/test-utils'
import FeedbackPrompt from './FeedbackPrompt'

function mockFetchOk() {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ status: 'ok', job_id: 1 }),
  })
}

function thumbButtons(container: HTMLElement) {
  return {
    up: container.querySelector<HTMLButtonElement>('.feedback-prompt__thumb--up')!,
    down: container.querySelector<HTMLButtonElement>('.feedback-prompt__thumb--down')!,
  }
}

describe('FeedbackPrompt', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('selects and toggles off an RPE chip', () => {
    renderWithQueryClient(<FeedbackPrompt activityId={1} />)

    const chip5 = screen.getByRole('button', { name: '5' })
    expect(chip5).not.toHaveClass('feedback-prompt__rpe-chip--selected')

    fireEvent.click(chip5)
    expect(chip5).toHaveClass('feedback-prompt__rpe-chip--selected')

    fireEvent.click(chip5)
    expect(chip5).not.toHaveClass('feedback-prompt__rpe-chip--selected')
  })

  it('submits a good rating with the selected RPE on thumbs-up', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const { container } = renderWithQueryClient(<FeedbackPrompt activityId={1} />)
    fireEvent.click(screen.getByRole('button', { name: '8' }))
    fireEvent.click(thumbButtons(container).up)

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/activities/1/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rating: 'good', rpe: 8 }),
        }),
      ),
    )
  })

  it('opens the setback modal on thumbs-down instead of submitting immediately', () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const { container } = renderWithQueryClient(<FeedbackPrompt activityId={1} />)
    fireEvent.click(thumbButtons(container).down)

    expect(screen.getByText('What went wrong?')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('submits a bad rating with the chosen setback tags after the modal', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const { container } = renderWithQueryClient(<FeedbackPrompt activityId={1} />)
    fireEvent.click(thumbButtons(container).down)
    fireEvent.click(screen.getByText('Not feeling 100%'))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/activities/1/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rating: 'bad', tags: ['Not feeling 100%'], rpe: null }),
        }),
      ),
    )
  })

  it('shows a loading state while feedback is submitting', async () => {
    let resolveFetch: (v: unknown) => void = () => {}
    const pending = new Promise(resolve => { resolveFetch = resolve })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending))

    const { container } = renderWithQueryClient(<FeedbackPrompt activityId={1} />)
    fireEvent.click(thumbButtons(container).up)

    await waitFor(() => expect(screen.getByText('Generating insights...')).toBeInTheDocument())
    resolveFetch({ ok: true, status: 200, json: async () => ({ status: 'ok' }) })
  })
})
