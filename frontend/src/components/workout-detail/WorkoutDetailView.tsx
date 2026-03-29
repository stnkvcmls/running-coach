import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCalendarEvent } from '../../api/hooks'
import type { CalendarEvent } from '../../api/types'
import { formatDistance } from '../../utils/formatting'
import { format, parseISO } from '../../utils/date'
import WorkoutSteps from '../today/WorkoutSteps'
import '../activity-detail/ActivityDetailView.css'
import './WorkoutDetailView.css'

export default function WorkoutDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const stateEvent = (location.state as { event?: CalendarEvent } | null)?.event
  const { data: fetchedEvent, isLoading } = useCalendarEvent(
    stateEvent ? 0 : Number(id) || 0
  )

  const event = stateEvent || fetchedEvent

  if (!stateEvent && isLoading) return <div className="spinner" />
  if (!event) return <div className="empty-state">Workout not found</div>

  const workoutType = event.workout_type || 'Workout'
  const totalDistance = event.distance_m ? formatDistance(event.distance_m) + ' km' : null

  return (
    <div className="activity-detail">
      <header className="detail-header" style={{ borderBottomColor: 'var(--warning)' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-info">
          <span className="badge" style={{ background: 'rgba(243,156,18,0.15)', color: 'var(--warning)' }}>
            {workoutType}
          </span>
          <h1 className="detail-title">{event.title || 'Workout'}</h1>
          <span className="detail-date">{format(parseISO(event.date), 'EEEE, d MMMM yyyy')}</span>
        </div>
      </header>

      <div className="detail-body">
        {totalDistance && (
          <div className="workout-detail-stats">
            <div>
              <div className="workout-detail-stat-value">
                {totalDistance.replace(' km', '')}
                <span className="workout-detail-stat-unit"> km</span>
              </div>
              <div className="workout-detail-stat-label">Distance</div>
            </div>
          </div>
        )}

        {event.workout_steps && event.workout_steps.length > 0 ? (
          <section className="detail-section">
            <h3 className="section-title">Description</h3>
            <div className="card workout-steps-card">
              <WorkoutSteps steps={event.workout_steps} />
            </div>
          </section>
        ) : event.workout_description ? (
          <section className="detail-section">
            <h3 className="section-title">Description</h3>
            <div className="card">
              <div className="workout-detail-description">{event.workout_description}</div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
