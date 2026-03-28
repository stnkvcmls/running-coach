import { Calendar } from 'lucide-react'
import { useDateContext } from '../../App'
import { getWeekNumber, getTotalWeeksInYear } from '../../utils/date'
import './TopBar.css'

interface Props {
  calendarExpanded: boolean
  onToggleCalendar: () => void
}

export default function TopBar({ calendarExpanded, onToggleCalendar }: Props) {
  const { selectedDate } = useDateContext()
  const weekNum = getWeekNumber(selectedDate)
  const totalWeeks = getTotalWeeksInYear(selectedDate.getFullYear())

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-week">Week {weekNum}/{totalWeeks}</span>
      </div>
      <button
        className={`top-bar-calendar-btn ${calendarExpanded ? 'active' : ''}`}
        onClick={onToggleCalendar}
        aria-label="Toggle calendar"
      >
        <Calendar size={20} />
      </button>
    </header>
  )
}
