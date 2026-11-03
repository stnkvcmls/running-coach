import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreRing from './ScoreRing'

describe('ScoreRing', () => {
  it('puts the band colour on the ring stroke only, never on the number', () => {
    const { container } = render(<ScoreRing score={55} color="#fdcb6e" />)

    const ring = container.querySelector('.score-ring') as HTMLElement
    expect(ring.style.getPropertyValue('--ring-color')).toBe('#fdcb6e')

    // The number inherits --text from ScoreRing.css (contrast fix, Y1) — an
    // inline band colour here would override it.
    const number = screen.getByText('55')
    expect(number).toHaveClass('score-ring-number')
    expect(number.style.color).toBe('')
  })

  it('renders the sub-label, defaulting to "/100"', () => {
    const { rerender } = render(<ScoreRing score={80} color="#00b894" />)
    expect(screen.getByText('/100')).toBeInTheDocument()

    rerender(<ScoreRing score={80} color="#00b894" subLabel="Good" />)
    expect(screen.getByText('Good')).toBeInTheDocument()
  })
})
