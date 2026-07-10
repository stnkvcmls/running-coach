import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useRouteMeta } from './App'

function metaAt(path: string) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  )
  return renderHook(() => useRouteMeta(), { wrapper }).result.current
}

describe('useRouteMeta chrome matrix', () => {
  it.each([
    ['/', 'main'],
    ['/plan', 'main'],
    ['/chat', 'main'],
    ['/activities', 'main'],
    ['/trends', 'main'],
    ['/daily', 'main'],
  ])('%s is main chrome', (path, chrome) => {
    expect(metaAt(path).chrome).toBe(chrome)
  })

  it.each([
    ['/activities/42', 'detail'],
    ['/daily/7', 'detail'],
    ['/workouts/3', 'detail'],
    ['/info/training-load', 'detail'],
    ['/plan/setup', 'detail'],
    ['/settings', 'detail'],
    ['/onboarding', 'detail'],
  ])('%s is detail chrome', (path, chrome) => {
    expect(metaAt(path).chrome).toBe(chrome)
  })

  it('only shows the week-label suffix on Today and Plan', () => {
    expect(metaAt('/').weekLabel).toBe(true)
    expect(metaAt('/plan').weekLabel).toBe(true)
    expect(metaAt('/chat').weekLabel).toBeFalsy()
    expect(metaAt('/activities').weekLabel).toBeFalsy()
    expect(metaAt('/trends').weekLabel).toBeFalsy()
  })

  it('gives each main-chrome tab its contextual title', () => {
    expect(metaAt('/').title).toBe('Today')
    expect(metaAt('/plan').title).toBe('Plan')
    expect(metaAt('/chat').title).toBe('Coach')
    expect(metaAt('/activities').title).toBe('Activities')
    expect(metaAt('/trends').title).toBe('Progress')
  })
})
