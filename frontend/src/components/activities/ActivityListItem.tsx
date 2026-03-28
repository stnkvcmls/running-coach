import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ActivitySummary } from '../../api/types'
import { getActivityColor, colorMap } from '../../utils/colors'
import { formatDistance, formatDuration, formatPace } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import './ActivityListItem.css'

interface Props {
  activity: ActivitySummary
}

export default function ActivityListItem({ activity }: Props) {
  const navigate = useNavigate()
  const colorType = getActivityColor(activity.name, activity.activity_type)
  const color = colorMap[colorType]

  return (
    <div
      className="activity-list-item card"
      onClick={() => navigate(`/activities/${activity.id}`)}
    >
      <div className="ali-left">
        <div className="ali-icon" style={{ background: `${color}22`, color }}>
          <div className="ali-icon-dot" style={{ background: color }} />
        </div>
        <div className="ali-info">
          <div className="ali-name">{activity.name || 'Workout'}</div>
          <div className="ali-meta">
            {activity.started_at && format(parseISO(activity.started_at), 'd MMM, HH:mm')}
          </div>
        </div>
      </div>
      <div className="ali-right">
        <div className="ali-stats">
          <span>{formatDistance(activity.distance_m)} km</span>
          <span className="ali-sep">&middot;</span>
          <span>{formatDuration(activity.duration_sec)}</span>
          <span className="ali-sep">&middot;</span>
          <span>{formatPace(activity.avg_pace_min_km)} /km</span>
        </div>
        <ChevronRight size={16} className="ali-chevron" />
      </div>
    </div>
  )
}
