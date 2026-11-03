import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import type { ActivitySummary } from '../../api/types'
import { getActivityAccent } from '../../utils/colors'
import { formatDistance, formatPace } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import './ActivityListItem.css'

interface Props {
  activity: ActivitySummary
}

/** One row of the Activities list (docs/UI_UX_CRITIQUE.md §6.4, A1/A2): a 4px
 * effort tick, the name over when it happened, distance (the figure runners
 * scan by) as the largest number, then pace over average HR. Four columns
 * instead of a middle-dot string, so nothing truncates at 360px. */
export default function ActivityListItem({ activity }: Props) {
  const effort = getActivityAccent(activity.name, activity.activity_type)
  const hasRecords = !!activity.personal_records && activity.personal_records.length > 0

  return (
    <Link
      to={`/activities/${activity.id}`}
      className="activity-list-item"
      style={{ '--effort': effort } as CSSProperties}
    >
      <span className="ali-tick" aria-hidden="true" />
      <div className="ali-main">
        <div className="ali-name">
          {activity.name || 'Workout'}
          {hasRecords && (
            <span
              className="ali-pb"
              title={activity.personal_records!.map(r => `${r.label}: ${r.display_value}`).join(', ')}
            >
              PB
            </span>
          )}
          {activity.workout_tag && (
            <span className="ali-tag" title={activity.workout_tag}>
              <CheckCircle size={11} aria-hidden="true" />
              Workout
            </span>
          )}
        </div>
        {activity.started_at && (
          <div className="ali-when">{format(parseISO(activity.started_at), 'EEE d, HH:mm')}</div>
        )}
      </div>
      <div className="ali-dist">
        <span className="num">{formatDistance(activity.distance_m)}</span>
        <small>km</small>
      </div>
      <div className="ali-pace">
        <span className="num">{formatPace(activity.avg_pace_min_km)}</span>
        <small>{activity.avg_hr != null ? `${activity.avg_hr} bpm` : '/km'}</small>
      </div>
    </Link>
  )
}
