import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('kaboom')
  return <div>Recovered content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // The crash below is intentional; React logs caught render errors to
    // console.error regardless, so silence it to keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the fallback card when a child throws', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('kaboom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Today' })).toBeInTheDocument()
  })

  it('re-renders children after "Try again" once the failure is gone', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ErrorBoundary>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <ErrorBoundary>
          <Bomb shouldThrow={false} />
        </ErrorBoundary>
      </MemoryRouter>,
    )
    // Still the fallback — retry state hasn't been reset yet.
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('Recovered content')).toBeInTheDocument()
  })

  it('leaves sibling nav landmarks mounted when the boundary catches a crash', () => {
    render(
      <MemoryRouter>
        <nav aria-label="Primary">Nav</nav>
        <ErrorBoundary>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
