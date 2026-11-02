import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import { DateContext } from '../../App'
import { useTrainingContext, type TrainingContext } from '../../hooks/useTrainingContext'
import TopBar from './TopBar'

vi.mock('../../api/hooks', async importOriginal => ({
  ...(await importOriginal<typeof import('../../api/hooks')>()),
  useMe: vi.fn(() => ({ data: { id: 1, email: 'alex@example.com', full_name: 'Alex' } })),
  useSyncStatus: vi.fn(() => ({ status: 'ok', lastSyncedAt: null })),
}))

vi.mock('../../hooks/useTrainingContext', async importOriginal => ({
  ...(await importOriginal<typeof import('../../hooks/useTrainingContext')>()),
  useTrainingContext: vi.fn(),
}))

const mockedUseTrainingContext = vi.mocked(useTrainingContext)

const EMPTY: TrainingContext = {
  phaseLabel: null, weekOfBlock: null, blockWeeks: null, goalRaceName: null, daysToGoal: null,
}

const FULL: TrainingContext = {
  phaseLabel: 'Build', weekOfBlock: 1, blockWeeks: 4, goalRaceName: 'Berlin Marathon', daysToGoal: 90,
}

// Tuesday 23 June 2026
const SELECTED = new Date(2026, 5, 23)

function renderTopBar(route: string, onToggleCalendar = vi.fn()) {
  const utils = renderWithProviders(
    <DateContext.Provider value={{ selectedDate: SELECTED, setSelectedDate: () => {} }}>
      <TopBar calendarExpanded={false} onToggleCalendar={onToggleCalendar} />
    </DateContext.Provider>,
    { route },
  )
  return { ...utils, onToggleCalendar }
}

describe('TopBar', () => {
  beforeEach(() => {
    mockedUseTrainingContext.mockReset()
    mockedUseTrainingContext.mockReturnValue(FULL)
  })

  it('on Today: titles the selected date and shows the training block for that date', () => {
    renderTopBar('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tuesday 23 June')
    expect(screen.getByText('Build block, week 1 of 4')).toBeInTheDocument()
    expect(mockedUseTrainingContext).toHaveBeenCalledWith(SELECTED)
  })

  it('on Today: falls back to the bare plan week when no phase is known', () => {
    mockedUseTrainingContext.mockReturnValue({ ...EMPTY, weekOfBlock: 2, blockWeeks: 4 })
    renderTopBar('/')

    expect(screen.getByText('Week 2 of 4')).toBeInTheDocument()
  })

  it('omits the subtitle when there is no training context', () => {
    mockedUseTrainingContext.mockReturnValue(EMPTY)
    const { container } = renderTopBar('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tuesday 23 June')
    expect(container.querySelector('.top-bar-subtitle')).toBeNull()
  })

  it('on Plan: titles "Plan" with the goal race countdown, measured from today', () => {
    renderTopBar('/plan')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Plan')
    expect(screen.getByText('Berlin Marathon in 90 days')).toBeInTheDocument()
    expect(screen.queryByText(/block/)).not.toBeInTheDocument()
    const contextDate = mockedUseTrainingContext.mock.calls[0][0] as Date
    expect(contextDate.toDateString()).toBe(new Date().toDateString())
  })

  it('on Plan: omits the subtitle when there is no upcoming goal race', () => {
    mockedUseTrainingContext.mockReturnValue({ ...FULL, goalRaceName: null, daysToGoal: null })
    const { container } = renderTopBar('/plan')

    expect(container.querySelector('.top-bar-subtitle')).toBeNull()
  })

  it.each([
    ['/activities', 'Activities'],
    ['/trends', 'Progress'],
    ['/chat', 'Coach'],
  ])('on %s: title only, no training-context lookup', (route, title) => {
    const { container } = renderTopBar(route)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
    expect(container.querySelector('.top-bar-subtitle')).toBeNull()
    expect(mockedUseTrainingContext).not.toHaveBeenCalled()
  })

  it('offers the calendar toggle only where the week strip renders (Today)', () => {
    const { onToggleCalendar, unmount } = renderTopBar('/')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }))
    expect(onToggleCalendar).toHaveBeenCalledTimes(1)
    unmount()

    renderTopBar('/plan')
    expect(screen.queryByRole('button', { name: 'Toggle calendar' })).not.toBeInTheDocument()
  })

  it('has no theme toggle (Appearance lives in Settings) and keeps the Settings avatar', () => {
    renderTopBar('/')

    expect(screen.queryByRole('button', { name: /theme/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveTextContent('A')
  })
})
