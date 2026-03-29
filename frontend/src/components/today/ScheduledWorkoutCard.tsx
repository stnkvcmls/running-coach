import type { CalendarEvent } from '../../api/types'
import { formatDistance } from '../../utils/formatting'
import WorkoutSteps from './WorkoutSteps'
import './ScheduledWorkoutCard.css'

interface Props {
  event: CalendarEvent
}

export default function ScheduledWorkoutCard({ event }: Props) {
  const steps = event.workout_steps
  const workoutType = event.workout_type || 'Workout'
  const totalDistance = event.distance_m ? formatDistance(event.distance_m) + ' km' : null

  return (
    <div className="scheduled-workout-card card">
      <div className="sw-header">
        <div className="sw-header-left">
          <span className="sw-badge">{workoutType}</span>
          <h3 className="sw-title">{event.title || 'Workout'}</h3>
        </div>
        {totalDistance && (
          <span className="sw-distance">{totalDistance}</span>
        )}
      </div>

      {steps && steps.length > 0 ? (
        <div className="sw-steps-wrapper">
          <WorkoutSteps steps={steps} />
        </div>
      ) : event.workout_description ? (
        <div className="sw-description">{event.workout_description}</div>
      ) : null}
    </div>
  )
}
