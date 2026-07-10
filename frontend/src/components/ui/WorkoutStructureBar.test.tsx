import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutStructureBar, { computeSegments } from './WorkoutStructureBar'
import type { WorkoutStep } from '../../api/types'

function step(overrides: Partial<WorkoutStep> = {}): WorkoutStep {
  return {
    step_order: 1,
    step_type: 'interval',
    end_condition: 'distance',
    end_condition_value: 1000,
    end_condition_display: '1km',
    target_type: null,
    target_display: null,
    description: null,
    activity_type: 'run',
    repeat_count: null,
    steps: null,
    ...overrides,
  }
}

describe('computeSegments', () => {
  it('maps warmup/work/cooldown to kinds weighted by end_condition_value, summing to 100% when normalised', () => {
    const steps: WorkoutStep[] = [
      step({ step_type: 'warmup', end_condition_value: 1000 }),
      step({ step_type: 'interval', end_condition_value: 6000 }),
      step({ step_type: 'cooldown', end_condition_value: 800 }),
    ]
    const segments = computeSegments(steps)
    expect(segments).toEqual([
      { kind: 'warmup', weight: 1000 },
      { kind: 'work', weight: 6000 },
      { kind: 'cooldown', weight: 800 },
    ])
    const total = segments.reduce((s, x) => s + x.weight, 0)
    const pct = segments.reduce((s, x) => s + (x.weight / total) * 100, 0)
    expect(pct).toBeCloseTo(100, 5)
  })

  it('expands a repeat block repeat_count times', () => {
    const steps: WorkoutStep[] = [
      step({ step_type: 'warmup', end_condition_value: 1000 }),
      step({
        step_type: 'repeat',
        repeat_count: 3,
        end_condition_value: null,
        steps: [
          step({ step_type: 'interval', end_condition_value: 400 }),
          step({ step_type: 'rest', activity_type: 'rest', end_condition: 'time', end_condition_value: 90 }),
        ],
      }),
      step({ step_type: 'cooldown', end_condition_value: 800 }),
    ]
    const segments = computeSegments(steps)
    expect(segments).toHaveLength(1 + 3 * 2 + 1)
    expect(segments.filter(s => s.kind === 'work')).toHaveLength(3)
    expect(segments.filter(s => s.kind === 'recover')).toHaveLength(3)
  })

  it('defaults a missing or zero end_condition_value to a weight of 1 (never zero-width)', () => {
    const steps: WorkoutStep[] = [
      step({ end_condition: null, end_condition_value: null }),
      step({ end_condition: 'distance', end_condition_value: 0 }),
    ]
    expect(computeSegments(steps)).toEqual([
      { kind: 'work', weight: 1 },
      { kind: 'work', weight: 1 },
    ])
  })
})

describe('WorkoutStructureBar', () => {
  const steps: WorkoutStep[] = [
    step({ step_type: 'warmup', end_condition_value: 1000 }),
    step({ step_type: 'interval', end_condition_value: 6000 }),
    step({ step_type: 'cooldown', end_condition_value: 800 }),
  ]

  it('renders one segment per computed segment, coloured by kind', () => {
    const { container } = render(<WorkoutStructureBar steps={steps} color="var(--color-tempo)" />)
    const segs = container.querySelectorAll('.workout-structure-seg')
    expect(segs).toHaveLength(3)
    expect((segs[0] as HTMLElement).style.background).toBe('var(--text-muted)')
    expect((segs[1] as HTMLElement).style.background).toBe('var(--color-tempo)')
    expect((segs[2] as HTMLElement).style.background).toBe('var(--text-muted)')
  })

  it('expands the step-by-step breakdown on click', () => {
    render(<WorkoutStructureBar steps={steps} />)
    expect(screen.queryByText(/Warm-Up/i)).not.toBeInTheDocument()

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Warm-Up/i)).toBeInTheDocument()
  })

  it('renders nothing for an empty step list', () => {
    const { container } = render(<WorkoutStructureBar steps={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
