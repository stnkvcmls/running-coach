import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RangeSelector, { DEFAULT_RANGE_OPTIONS } from './RangeSelector'

describe('RangeSelector', () => {
  it('renders one button per option and marks the active value pressed', () => {
    render(<RangeSelector options={DEFAULT_RANGE_OPTIONS} value={90} onChange={() => {}} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    expect(screen.getByRole('button', { name: '90d' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '90d' })).toHaveClass('active')
  })

  it('calls onChange with the clicked option value', () => {
    const onChange = vi.fn()
    render(<RangeSelector options={DEFAULT_RANGE_OPTIONS} value={30} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '365d' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(365)
  })

  it('supports a custom option set', () => {
    render(
      <RangeSelector
        options={[{ label: '4w', value: 28 }, { label: '8w', value: 56 }]}
        value={28}
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '4w' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '8w' })).toHaveAttribute('aria-pressed', 'false')
  })
})
