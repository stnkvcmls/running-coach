import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatView from './ChatView'
import type { ChatAction, ChatMessage } from '../../api/types'

function sseResponse(tokens: string[], actions: ChatAction[] = []) {
  const encoder = new TextEncoder()
  const events: string[] = []
  for (const token of tokens) events.push(`data: ${JSON.stringify({ token })}\n\n`)
  for (const action of actions) events.push(`data: ${JSON.stringify({ action })}\n\n`)
  events.push('data: [DONE]\n\n')
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) controller.enqueue(encoder.encode(event))
      controller.close()
    },
  })
  return { ok: true, status: 200, body }
}

function mockFetch(history: ChatMessage[], stream: { tokens: string[]; actions?: ChatAction[] }) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      return Promise.resolve(sseResponse(stream.tokens, stream.actions ?? []))
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ messages: history }) })
  })
}

describe('ChatView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders chat history including an action chip for a tool action the coach took', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(
        [
          {
            id: 1,
            role: 'user',
            content: 'Log an easy 5k',
            created_at: '2026-07-09T08:00:00Z',
            activity_id: null,
          },
          {
            id: 2,
            role: 'assistant',
            content: 'Done — logged it.',
            created_at: '2026-07-09T08:00:05Z',
            activity_id: null,
            actions: [{ type: 'log_run', status: 'done', job_id: null, summary: 'Logged a 5k easy run' }],
          },
        ],
        { tokens: [] },
      ),
    )

    render(<ChatView />)

    await screen.findByText('Done — logged it.')
    expect(screen.getByText('Logged a 5k easy run')).toBeInTheDocument()
  })

  it('shows hint prompts when there is no chat history yet', async () => {
    vi.stubGlobal('fetch', mockFetch([], { tokens: [] }))
    render(<ChatView />)

    expect(await screen.findByText('Ask your AI coach anything')).toBeInTheDocument()
    expect(screen.getByText('Am I ready for my next race?')).toBeInTheDocument()
  })

  it('sends a hint prompt as a message and renders the streamed reply with its action chip', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([], {
        tokens: ['Your ', 'week ', 'looked solid.'],
        actions: [{ type: 'summarize_week', status: 'done', job_id: null, summary: 'Reviewed this week' }],
      }),
    )
    render(<ChatView />)

    const hint = await screen.findByText('How was my training this week?')
    fireEvent.click(hint)

    // The streamed assistant reply and its action chip land once the stream completes.
    await waitFor(() => expect(screen.getByText('Your week looked solid.')).toBeInTheDocument())
    expect(screen.getByText('Reviewed this week')).toBeInTheDocument()

    // The user's own message is still shown above the reply.
    expect(screen.getByText('How was my training this week?')).toBeInTheDocument()
  })
})
