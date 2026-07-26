import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Numeral from './Numeral'
import { ThemeContext } from '../../App'

function renderNothing(value: string) {
  return render(
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {}, skin: 'nothing-signal', setSkin: () => {} }}>
      <Numeral value={value} />
    </ThemeContext.Provider>,
  )
}

describe('Numeral', () => {
  it('renders plain text in the default skin', () => {
    const { container } = render(<Numeral value="7h 32m" />)
    expect(container.querySelector('.dot-matrix')).toBeNull()
    expect(screen.getByText('7h 32m')).toBeInTheDocument()
  })

  it('renders a dot-matrix readout under a Nothing skin for supported characters', () => {
    const { container } = renderNothing('12,345')
    expect(container.querySelector('.dot-matrix')).not.toBeNull()
    expect(screen.getByRole('img', { name: '12,345' })).toBeInTheDocument()
  })

  it('keeps the sign and group separator instead of dropping them', () => {
    renderNothing('+14')
    expect(screen.getByRole('img', { name: '+14' })).toBeInTheDocument()
  })

  // H1: unsupported characters (letters like "h"/"m") used to silently blank
  // out under DotMatrix's 16-glyph table, making "7h 32m" read as "7 32" — a
  // different, misleading number. Falling back to plain text is safer than a
  // value the user can misread.
  it('falls back to plain text under a Nothing skin when the value has unsupported characters', () => {
    const { container } = renderNothing('7h 32m')
    expect(container.querySelector('.dot-matrix')).toBeNull()
    expect(screen.getByText('7h 32m')).toBeInTheDocument()
  })
})
