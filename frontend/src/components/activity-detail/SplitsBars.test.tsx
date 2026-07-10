import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SplitsBars from './SplitsBars'
import type { MetricZone } from '../../api/types'

const splits = [
  { distance: 1000, duration: 300, averageHR: 140 }, // 5:00/km
  { distance: 1000, duration: 270, averageHR: 150 }, // 4:30/km
  { distance: 1000, duration: 250, averageHR: 160 }, // 4:10/km
]

const paceZones: MetricZone[] = [
  { metric_key: 'pace', zone_name: 'Fast', zone_color: '#fab1a0', percentile_label: '', min_value: null, max_value: 4.5 },
  { metric_key: 'pace', zone_name: 'Easy', zone_color: '#55efc4', percentile_label: '', min_value: 4.5, max_value: null },
]

describe('SplitsBars', () => {
  it('defaults to bars for 3+ splits, one bar per split, coloured by pace zone', () => {
    const { container } = render(<SplitsBars splits={splits} paceZones={paceZones} color="#6c5ce7" />)

    const bars = container.querySelectorAll('.split-bar')
    expect(bars).toHaveLength(splits.length)

    // 5:00/km and 4:30/km fall in "Easy" (>= 4.5); 4:10/km falls in "Fast" (< 4.5).
    expect((bars[0] as HTMLElement).style.background).toBe('rgb(85, 239, 196)')
    expect((bars[1] as HTMLElement).style.background).toBe('rgb(85, 239, 196)')
    expect((bars[2] as HTMLElement).style.background).toBe('rgb(250, 177, 160)')
  })

  it('falls back to the activity colour when no pace zones are supplied', () => {
    const { container } = render(<SplitsBars splits={splits} color="#6c5ce7" />)
    const bars = container.querySelectorAll('.split-bar')
    bars.forEach(bar => expect((bar as HTMLElement).style.background).toBe('rgb(108, 92, 231)'))
  })

  it('defaults to table for fewer than 3 splits', () => {
    render(<SplitsBars splits={splits.slice(0, 2)} color="#6c5ce7" />)
    expect(screen.getByRole('button', { name: 'Table' })).toHaveClass('active')
    expect(screen.getByRole('columnheader', { name: 'Pace' })).toBeInTheDocument()
  })

  it('toggles between bars and table', () => {
    const { container } = render(<SplitsBars splits={splits} paceZones={paceZones} color="#6c5ce7" />)
    expect(container.querySelectorAll('.split-bar')).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(container.querySelectorAll('.split-bar')).toHaveLength(0)
    expect(screen.getByRole('columnheader', { name: 'Pace' })).toBeInTheDocument()
  })

  it('renders nothing when there are no splits', () => {
    const { container } = render(<SplitsBars splits={[]} color="#6c5ce7" />)
    expect(container).toBeEmptyDOMElement()
  })
})
