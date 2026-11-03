import { useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import WeekStrip from './WeekStrip'
import MonthCalendar from './MonthCalendar'
import './CalendarContainer.css'

interface Props {
  expanded: boolean
  onToggle: (expanded: boolean) => void
}

export default function CalendarContainer({ expanded, onToggle }: Props) {
  const touchStartY = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const { pathname } = useLocation()

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const delta = e.touches[0].clientY - touchStartY.current
    // Only allow pulling down when collapsed, or pulling up when expanded
    if (!expanded && delta > 0) {
      setDragOffset(Math.min(delta * 0.5, 100))
    } else if (expanded && delta < 0) {
      setDragOffset(Math.max(delta * 0.5, -100))
    }
  }, [expanded])

  const handleTouchEnd = useCallback(() => {
    const threshold = 40
    if (!expanded && dragOffset > threshold) {
      onToggle(true)
    } else if (expanded && dragOffset < -threshold) {
      onToggle(false)
    }
    setDragOffset(0)
    setDragging(false)
    touchStartY.current = null
  }, [expanded, dragOffset, onToggle])

  // Today renders its own WeekRail (in TodayView), so the collapsed week
  // strip is redundant there; the month calendar still opens from the
  // TopBar toggle. TODO: drop RouteMeta.weekStrip's strip half in App.tsx.
  if (!expanded && pathname === '/') return null

  return (
    <div
      className={`calendar-container ${expanded ? 'expanded' : 'collapsed'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={dragging ? { transform: `translateY(${dragOffset}px)` } : undefined}
    >
      {expanded ? <MonthCalendar /> : <WeekStrip />}
      <div className="calendar-handle">
        <div className="handle-bar" />
      </div>
    </div>
  )
}
