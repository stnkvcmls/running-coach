import { useRef, useState, useCallback } from 'react'
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
