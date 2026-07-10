import { Link } from 'react-router-dom'
import { ChevronRight, CheckCircle } from 'lucide-react'
import type { ActivitySummary } from '../../api/types'
import { getActivityAccent } from '../../utils/colors'
import { getSportIcon } from '../../utils/sportIcon'
import { formatDistance, formatDuration, formatPace } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import './ActivityListItem.css'

interface Props {
  activity: ActivitySummary
}

export default function ActivityListItem({ activity }: Props) {
  const color = getActivityAccent(activity.name, activity.activity_type)
  const SportIcon = getSportIcon(activity.activity_type)

  return (
    <Link to={`/activities/${activity.id}`} className="activity-list-item card">
      <div className="ali-icon" style={{ background: `${color}22`, color }}>
        <SportIcon size={18} />
      </div>
      <div className="ali-main">
        <div className="ali-name-row">
          <span className="ali-name">{activity.name || 'Workout'}</span>
          {activity.workout_tag && (
            <span className="ali-tag" title={activity.workout_tag}>
              <CheckCircle size={11} />
              Workout
            </span>
          )}
        </div>
        <div className="ali-meta">
          {activity.started_at && (
            <>
              {format(parseISO(activity.started_at), 'EEE · HH:mm')}
              <span className="ali-sep">&middot;</span>
            </>
          )}
          <span>{formatDistance(activity.distance_m)} km</span>
          <span className="ali-sep">&middot;</span>
          <span>{formatDuration(activity.duration_sec)}</span>
          <span className="ali-sep">&middot;</span>
          <span>{formatPace(activity.avg_pace_min_km)} /km</span>
          {activity.avg_hr != null && (
            <>
              <span className="ali-sep">&middot;</span>
              <span>&hearts; {activity.avg_hr}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="ali-chevron" />
    </Link>
  )
}
