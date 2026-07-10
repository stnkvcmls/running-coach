import { useNavigate } from 'react-router-dom'
import { Calendar, Sun, Moon } from 'lucide-react'
import { useDateContext, useTheme, useRouteMeta } from '../../App'
import { useMe } from '../../api/hooks'
import { getWeekNumber, getTotalWeeksInYear } from '../../utils/date'
import SyncStatusPill from './SyncStatusPill'
import './TopBar.css'

interface Props {
  calendarExpanded: boolean
  onToggleCalendar: () => void
}

function avatarInitial(name: string | null | undefined, email: string | undefined): string {
  const source = (name || email || '').trim()
  return source ? source.charAt(0).toUpperCase() : '?'
}

export default function TopBar({ calendarExpanded, onToggleCalendar }: Props) {
  const { selectedDate } = useDateContext()
  const { theme, toggleTheme } = useTheme()
  const { title, weekLabel } = useRouteMeta()
  const { data: me } = useMe()
  const navigate = useNavigate()
  const weekNum = getWeekNumber(selectedDate)
  const totalWeeks = getTotalWeeksInYear(selectedDate.getFullYear())

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-title">
          {title}
          {weekLabel && <small className="top-bar-week">Week {weekNum}/{totalWeeks}</small>}
        </span>
      </div>
      <div className="top-bar-actions">
        <SyncStatusPill />
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
        <button
          className="top-bar-avatar"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          {avatarInitial(me?.full_name, me?.email)}
        </button>
      </div>
    </header>
  )
}
