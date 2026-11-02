import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeContext } from '../../App'
import type { ThemePreference } from '../../hooks/useThemePreference'
import AppearanceSection from './AppearanceSection'

function renderWith(preference: ThemePreference, setPreference = vi.fn()) {
  render(
    <ThemeContext.Provider value={{ theme: 'dark', preference, setPreference }}>
      <AppearanceSection />
    </ThemeContext.Provider>,
  )
  return setPreference
}

describe('AppearanceSection', () => {
  it('renders System / Light / Dark as a labelled radio group with the current choice checked', () => {
    renderWith('system')

    const group = screen.getByRole('radiogroup', { name: 'Appearance' })
    expect(group).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios.map(r => r.textContent)).toEqual(['System', 'Light', 'Dark'])
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'false')
  })

  it('keeps a single Tab stop on the checked option (roving tabindex)', () => {
    renderWith('light')

    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('tabindex', '-1')
  })

  it('sets the preference on click', () => {
    const setPreference = renderWith('system')

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))

    expect(setPreference).toHaveBeenCalledWith('dark')
  })

  it('moves and selects with arrow keys, wrapping at both ends', () => {
    const setPreference = renderWith('system')

    fireEvent.keyDown(screen.getByRole('radio', { name: 'System' }), { key: 'ArrowRight' })
    expect(setPreference).toHaveBeenLastCalledWith('light')
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('radio', { name: 'System' }), { key: 'ArrowLeft' })
    expect(setPreference).toHaveBeenLastCalledWith('dark')

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Dark' }), { key: 'ArrowDown' })
    expect(setPreference).toHaveBeenLastCalledWith('system')
  })
})
