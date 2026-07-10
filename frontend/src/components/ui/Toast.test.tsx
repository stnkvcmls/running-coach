import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { toast, ToastHost } from './Toast'

describe('ToastHost', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Let any pending dismiss timers run out so module state doesn't leak
    // into the next test, then restore real timers.
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
  })

  it('renders nothing when no toast has been queued', () => {
    const { container } = render(<ToastHost />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a queued toast and expires it after 4s', () => {
    render(<ToastHost />)

    act(() => {
      toast('Sent to watch', { kind: 'success' })
    })
    expect(screen.getByText('Sent to watch')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.queryByText('Sent to watch')).not.toBeInTheDocument()
  })

  it('dismisses on click before the timer fires', () => {
    render(<ToastHost />)

    act(() => {
      toast('Tap to dismiss')
    })
    const el = screen.getByText('Tap to dismiss')
    act(() => {
      el.click()
    })
    expect(screen.queryByText('Tap to dismiss')).not.toBeInTheDocument()
  })

  it('keeps at most 2 toasts stacked', () => {
    render(<ToastHost />)

    act(() => {
      toast('First')
      toast('Second')
      toast('Third')
    })

    expect(screen.queryByText('First')).not.toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })
})
