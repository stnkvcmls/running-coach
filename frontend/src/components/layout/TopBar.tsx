import { useNavigate } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useDateContext, useRouteMeta } from '../../App'
import { useMe } from '../../api/hooks'
import { useTrainingContext, formatBlockLine, formatGoalLine } from '../../hooks/useTrainingContext'
import { format } from '../../utils/date'
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

/** Its own component so the plan/season/race queries behind it only run on
 * routes that show a subtitle. Renders nothing until there's something to say. */
function TopBarSubtitle({ kind, date }: { kind: 'block' | 'goal'; date: Date }) {
  const context = useTrainingContext(date)
  const text = kind === 'block' ? formatBlockLine(context) : formatGoalLine(context)
  return text ? <p className="top-bar-subtitle">{text}</p> : null
}

export default function TopBar({ calendarExpanded, onToggleCalendar }: Props) {
  const { selectedDate } = useDateContext()
  const { title, weekStrip, subtitle } = useRouteMeta()
  const { data: me } = useMe()
  const navigate = useNavigate()
  // A page with the week strip is about the day it selects: title it with
  // that date, and read the training context for that day rather than today.
  const contextDate = weekStrip ? selectedDate : new Date()

  return (
    <header className="top-bar">
      <div className="top-bar-heading">
        <h1 className="top-bar-title">{weekStrip ? format(selectedDate, 'EEEE d MMMM') : title}</h1>
        {subtitle && <TopBarSubtitle kind={subtitle} date={contextDate} />}
      </div>
      <div className="top-bar-actions">
        <SyncStatusPill />
        {weekStrip && (
          <button
            className={`top-bar-icon-btn ${calendarExpanded ? 'active' : ''}`}
            onClick={onToggleCalendar}
            aria-label="Toggle calendar"
            aria-expanded={calendarExpanded}
          >
            <Calendar size={20} />
          </button>
        )}
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
