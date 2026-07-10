import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import BottomNav from './BottomNav'

describe('BottomNav', () => {
  it('renders exactly 5 tabs, each with an accessible name', () => {
    renderWithProviders(<BottomNav />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(links.map(l => l.textContent)).toEqual([
      'Today',
      'Plan',
      'Coach',
      'Activities',
      'Progress',
    ])
  })

  it('routes each tab to its expected path', () => {
    renderWithProviders(<BottomNav />)

    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Plan' })).toHaveAttribute('href', '/plan')
    expect(screen.getByRole('link', { name: 'Coach' })).toHaveAttribute('href', '/chat')
    expect(screen.getByRole('link', { name: 'Activities' })).toHaveAttribute('href', '/activities')
    expect(screen.getByRole('link', { name: 'Progress' })).toHaveAttribute('href', '/trends')
  })
})
