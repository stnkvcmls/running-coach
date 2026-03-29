import type { CalendarEvent, WorkoutStep } from '../../api/types'
import { formatDistance } from '../../utils/formatting'
import './ScheduledWorkoutCard.css'

interface Props {
  event: CalendarEvent
}

function sectionLabel(stepType: string): string {
  switch (stepType) {
    case 'warmup': return 'Warm-Up'
    case 'cooldown': return 'Cool Down'
    case 'rest': return 'Rest'
    case 'repeat': return 'Repeat'
    default: return 'Session'
  }
}

function activityLabel(step: WorkoutStep): string {
  if (step.step_type === 'rest' || step.activity_type === 'rest') return 'REST'
  return 'RUN'
}

function StepRow({ step }: { step: WorkoutStep }) {
  const label = activityLabel(step)
  const isRest = label === 'REST'

  return (
    <div className="sw-step-row">
      <div className="sw-step-info">
        {step.end_condition_display && (
          <span className="sw-step-metric">{step.end_condition_display}</span>
        )}
        {step.target_display && (
          <>
            <span className="sw-step-separator">at</span>
            <span className="sw-step-target">{step.target_display}</span>
          </>
        )}
        {!step.end_condition_display && !step.target_display && step.description && (
          <span className="sw-step-metric">{step.description}</span>
        )}
      </div>
      <span className={`sw-step-type ${isRest ? 'sw-step-type--rest' : 'sw-step-type--run'}`}>
        {label}
      </span>
    </div>
  )
}

function StepSection({ step, stepNumber }: { step: WorkoutStep; stepNumber: number }) {
  const isRepeat = step.step_type === 'repeat'
  const isWarmup = step.step_type === 'warmup'
  const isCooldown = step.step_type === 'cooldown'
  const isRest = step.step_type === 'rest'
  const isInterval = !isRepeat && !isWarmup && !isCooldown && !isRest

  const headerClass = isRepeat
    ? 'sw-section-header sw-section-header--repeat'
    : isInterval
      ? 'sw-section-header sw-section-header--session'
      : 'sw-section-header'

  const headerLabel = isRepeat && step.repeat_count
    ? `Repeat x${step.repeat_count}`
    : sectionLabel(step.step_type)

  return (
    <div className="sw-section">
      <div className={headerClass}>
        <span className="sw-section-label">{headerLabel}</span>
      </div>
      <div className="sw-section-body">
        {isRepeat && step.steps ? (
          step.steps.map((child, i) => (
            <div key={i} className="sw-step-numbered">
              <span className="sw-step-num">{stepNumber + i}</span>
              <div className="sw-step-content">
                <StepRow step={child} />
                {child.description && (
                  <div className="sw-step-desc">{child.description}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="sw-step-numbered">
            <span className="sw-step-num">{stepNumber}</span>
            <div className="sw-step-content">
              <StepRow step={step} />
              {step.description && !(!step.end_condition_display && !step.target_display) && (
                <div className="sw-step-desc">{step.description}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ScheduledWorkoutCard({ event }: Props) {
  const steps = event.workout_steps
  const workoutType = event.workout_type || 'Workout'
  const totalDistance = event.distance_m ? formatDistance(event.distance_m) + ' km' : null

  // Calculate step numbers accounting for repeat sub-steps
  let stepCounter = 1
  const stepNumbers: number[] = []
  if (steps) {
    for (const step of steps) {
      stepNumbers.push(stepCounter)
      if (step.step_type === 'repeat' && step.steps) {
        stepCounter += step.steps.length
      } else {
        stepCounter += 1
      }
    }
  }

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
        <div className="sw-steps">
          {steps.map((step, i) => (
            <StepSection key={i} step={step} stepNumber={stepNumbers[i]} />
          ))}
        </div>
      ) : event.workout_description ? (
        <div className="sw-description">{event.workout_description}</div>
      ) : null}
    </div>
  )
}
