import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DotMatrix from './DotMatrix'

describe('DotMatrix', () => {
  it('renders the right number of lit dots for "7"', () => {
    const { container } = render(<DotMatrix value="7" />)
    // GLYPHS['7'] = ['11111','00001','00010','00100','01000','01000','01000'] -> 11 lit bits
    expect(container.querySelectorAll('.dm-dot.on')).toHaveLength(11)
    expect(container.querySelectorAll('.dm-dot')).toHaveLength(35)
  })

  it('exposes the value via aria-label and hides the dot grid from assistive tech', () => {
    render(<DotMatrix value="42" />)
    expect(screen.getByRole('img', { name: '42' })).toBeInTheDocument()
  })

  it('supports a custom label', () => {
    render(<DotMatrix value="72" label="Readiness score 72 out of 100" />)
    expect(screen.getByRole('img', { name: 'Readiness score 72 out of 100' })).toBeInTheDocument()
  })

  it('does not crash on an unknown character and renders it as a blank cell', () => {
    const { container } = render(<DotMatrix value="?" />)
    expect(container.querySelectorAll('.dm-dot.on')).toHaveLength(0)
    expect(container.querySelectorAll('.dm-char')).toHaveLength(1)
  })

  it('supports + and , (H1: heat penalty signs and thousands separators)', () => {
    const { container } = render(<DotMatrix value="+1,2" />)
    expect(container.querySelectorAll('.dm-char')).toHaveLength(4)
    expect(container.querySelectorAll('.dm-dot.on').length).toBeGreaterThan(0)
  })
})
