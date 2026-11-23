import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReadinessLine from './ReadinessLine'
import type { TrainingReadiness } from '../../api/types'

function readiness(overrides: Partial<TrainingReadiness> = {}): TrainingReadiness {
  return {
    score: 78,
    label: 'Very Good',
    verdict: 'train',
    verdict_label: 'Train as planned',
    reasons: [],
    sleep_component: 80,
    recovery_component: 75,
    fatigue_component: 70,
    rhr_component: 82,
    hrv_component: 76,
    subjective_component: null,
    ...overrides,
  }
}

describe('ReadinessLine', () => {
  it('leads with verdict_label, shows Readiness score, and falls back when reasons are empty', () => {
    render(<ReadinessLine readiness={readiness()} />)

    const btn = screen.getByRole('button', { name: /train as planned\. readiness 78 out of 100/i })
    expect(btn).toHaveClass('readiness-line--train')
    expect(btn).toHaveTextContent('Train as planned')
    expect(btn).toHaveTextContent('Readiness 78')
    expect(btn).toHaveTextContent('Nothing is holding you back.')
  })

  it('applies ease and rest modifier classes and renders each server reason on its own line', () => {
    const { rerender } = render(
      <ReadinessLine
        readiness={readiness({
          score: 42,
          label: 'Fair',
          verdict: 'ease',
          verdict_label: 'Ease off today',
          reasons: ['Short or poor sleep last night.', 'Recent training load is high.'],
        })}
      />,
    )

    const easeBtn = screen.getByRole('button', { name: /ease off today\. readiness 42 out of 100/i })
    expect(easeBtn).toHaveClass('readiness-line--ease')
    const lines = easeBtn.querySelectorAll('.readiness-line-reason')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toHaveTextContent('Short or poor sleep last night.')
    expect(lines[1]).toHaveTextContent('Recent training load is high.')

    rerender(
      <ReadinessLine
        readiness={readiness({
          score: 25,
          label: 'Low',
          verdict: 'rest',
          verdict_label: 'Rest or go very easy',
          reasons: ['Overnight HRV is below your baseline.'],
        })}
      />,
    )

    const restBtn = screen.getByRole('button', { name: /rest or go very easy\. readiness 25 out of 100/i })
    expect(restBtn).toHaveClass('readiness-line--rest')
    expect(restBtn).toHaveTextContent('Overnight HRV is below your baseline.')
  })

  it('toggles the component breakdown on tap', () => {
    render(<ReadinessLine readiness={readiness()} />)

    const btn = screen.getByRole('button', { name: /train as planned/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Freshness')).not.toBeInTheDocument()

    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Sleep')).toBeInTheDocument()
    expect(screen.getByText('Freshness')).toBeInTheDocument()
    expect(screen.getByText('HRV')).toBeInTheDocument()

    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Freshness')).not.toBeInTheDocument()
  })
})
