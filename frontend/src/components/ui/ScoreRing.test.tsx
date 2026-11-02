import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ScoreRing from './ScoreRing'
import { ThemeContext } from '../../App'

function renderNothing(score: number) {
  return render(
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {}, skin: 'nothing-signal', setSkin: () => {} }}>
      <ScoreRing score={score} color="#ffffff" size={100} />
    </ThemeContext.Provider>,
  )
}

describe('ScoreRing', () => {
  it('clamps the progress arc to 100 for an in-range score', () => {
    const { container } = render(<ScoreRing score={72} color="#fff" />)
    const arc = container.querySelectorAll('.score-ring-arc')[1]
    expect(arc).toHaveStyle({ strokeDasharray: '72 100' })
  })

  it('renders a 2-digit score at the default dot size', () => {
    const { container } = renderNothing(72)
    const dotMatrix = container.querySelector('.dot-matrix') as HTMLElement
    expect(dotMatrix.style.getPropertyValue('--dm-d')).toBe('3px')
  })

  it('shrinks the dot grid for a 3-digit score (100) so it fits inside the ring', () => {
    const { container, getByRole } = renderNothing(100)
    expect(getByRole('img', { name: '100' })).toBeInTheDocument()
    const dotMatrix = container.querySelector('.dot-matrix') as HTMLElement
    expect(dotMatrix.style.getPropertyValue('--dm-d')).toBe('2px')
    // 3 chars * (5*2 + 4*1) + 2 * (2 + 1*1.5) = 3*14 + 2*3.5 = 49px, comfortably
    // inside the ring's ~69px inner chord (vs. 81px at the default dot=3/gap=2).
    expect(container.querySelectorAll('.dm-char')).toHaveLength(3)
  })
})
