import { describe, it, expect, afterEach } from 'vitest'
import { useState, useEffect } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ThemeContext, type Skin } from '../../App'
import AppearanceSection from './AppearanceSection'

// Mirrors App.tsx's real skin state + effect, so clicking a style row
// exercises the same localStorage/DOM-attribute wiring the app uses — the
// default ThemeContext value is a no-op stub and wouldn't catch regressions.
function Harness() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [skin, setSkin] = useState<Skin>(() => {
    const stored = localStorage.getItem('skin')
    return stored === 'nothing-signal' || stored === 'nothing-app' ? stored : 'default'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', skin)
    localStorage.setItem('skin', skin)
  }, [skin])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
        skin,
        setSkin,
      }}
    >
      <AppearanceSection />
    </ThemeContext.Provider>
  )
}

describe('AppearanceSection', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-skin')
  })

  it('renders three style options with the stored one checked', () => {
    localStorage.setItem('skin', 'nothing-app')
    render(<Harness />)

    const styleGroup = screen.getByRole('group', { name: 'Style' })
    expect(within(styleGroup).getAllByRole('radio')).toHaveLength(3)
    expect(within(styleGroup).getByRole('radio', { name: /nothing — app inks/i })).toBeChecked()
    expect(within(styleGroup).getByRole('radio', { name: /^default/i })).not.toBeChecked()
  })

  it('sets data-skin and persists to localStorage when "Nothing — app inks" is clicked', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('radio', { name: /nothing — app inks/i }))

    expect(document.documentElement.getAttribute('data-skin')).toBe('nothing-app')
    expect(localStorage.getItem('skin')).toBe('nothing-app')
  })

  it('falls back to default for an invalid stored value', () => {
    localStorage.setItem('skin', 'garbage')
    render(<Harness />)

    expect(screen.getByRole('radio', { name: /^default/i })).toBeChecked()
  })
})
