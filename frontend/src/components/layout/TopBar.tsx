import { Calendar, Sun, Moon } from 'lucide-react'
import { useDateContext, useTheme } from '../../App'
import { getWeekNumber, getTotalWeeksInYear } from '../../utils/date'
import './TopBar.css'

interface Props {
  calendarExpanded: boolean
  onToggleCalendar: () => void
}

export default function TopBar({ calendarExpanded, onToggleCalendar }: Props) {
  const { selectedDate } = useDateContext()
  const { theme, toggleTheme } = useTheme()
  const weekNum = getWeekNumber(selectedDate)
  const totalWeeks = getTotalWeeksInYear(selectedDate.getFullYear())

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-week">Week {weekNum}/{totalWeeks}</span>
      </div>
      <div className="top-bar-actions">
        <button
          className="top-bar-icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className={`top-bar-icon-btn ${calendarExpanded ? 'active' : ''}`}
          onClick={onToggleCalendar}
          aria-label="Toggle calendar"
        >
          <Calendar size={20} />
        </button>
      </div>
    </header>
  )
}
