import { useNavigate } from 'react-router-dom'
import type { ActivitySummary } from '../../api/types'
import { getActivityColor, colorMap } from '../../utils/colors'
import { formatDistance, formatDuration, formatPace } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import './WorkoutCard.css'

interface Props {
  activity: ActivitySummary
}

export default function WorkoutCard({ activity }: Props) {
  const navigate = useNavigate()
  const colorType = getActivityColor(activity.name, activity.activity_type)
  const color = colorMap[colorType]

  const typeLabel = colorType === 'default'
    ? (activity.activity_type || 'Activity')
    : colorType.charAt(0).toUpperCase() + colorType.slice(1)

  return (
    <div
      className="workout-card card"
      style={{ borderLeftColor: color }}
      onClick={() => navigate(`/activities/${activity.id}`)}
    >
      <div className="workout-header">
        <span className="badge" style={{ background: `${color}22`, color }}>{typeLabel}</span>
        {activity.started_at && (
          <span className="workout-time">{format(parseISO(activity.started_at), 'HH:mm')}</span>
        )}
      </div>
      <div className="workout-name">{activity.name || 'Workout'}</div>
      <div className="workout-stats">
        <div className="workout-stat">
          <span className="stat-label">Distance</span>
          <span className="stat-value">{formatDistance(activity.distance_m)} <span className="stat-unit">km</span></span>
        </div>
        <div className="workout-stat">
          <span className="stat-label">Duration</span>
          <span className="stat-value">{formatDuration(activity.duration_sec)}</span>
        </div>
        <div className="workout-stat">
          <span className="stat-label">Pace</span>
          <span className="stat-value">{formatPace(activity.avg_pace_min_km)} <span className="stat-unit">/km</span></span>
        </div>
        {activity.avg_hr && (
          <div className="workout-stat">
            <span className="stat-label">Avg HR</span>
            <span className="stat-value">{activity.avg_hr} <span className="stat-unit">bpm</span></span>
          </div>
        )}
      </div>
    </div>
  )
}
