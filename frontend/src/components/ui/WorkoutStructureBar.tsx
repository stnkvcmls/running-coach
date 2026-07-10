import { useState } from 'react'
import type { WorkoutStep } from '../../api/types'
import WorkoutSteps from '../today/WorkoutSteps'
import './WorkoutStructureBar.css'

export type StructureSegmentKind = 'warmup' | 'cooldown' | 'work' | 'recover'

export interface StructureSegment {
  kind: StructureSegmentKind
  weight: number
}

function segmentKind(step: WorkoutStep): StructureSegmentKind {
  if (step.step_type === 'warmup') return 'warmup'
  if (step.step_type === 'cooldown') return 'cooldown'
  if (step.step_type === 'rest' || step.activity_type === 'rest') return 'recover'
  return 'work'
}

/** Flat reference pace used only to make a *mixed* time/distance workout's
 * segments visually comparable — the bar illustrates proportions, not an
 * accurate time prediction, so one shared constant is fine. */
const REFERENCE_PACE_SEC_PER_KM = 330

function segmentWeight(step: WorkoutStep, unitsMixed: boolean): number {
  const value = step.end_condition_value
  if (value == null || value <= 0) return 1
  if (!unitsMixed) return value
  if (step.end_condition === 'distance') return (value / 1000) * REFERENCE_PACE_SEC_PER_KM
  if (step.end_condition === 'time') return value
  return 1
}

/** Recursively expand repeat blocks into their constituent leaf steps
 * (repeated `repeat_count` times each). */
function flattenSteps(steps: WorkoutStep[]): WorkoutStep[] {
  const out: WorkoutStep[] = []
  for (const step of steps) {
    if (step.step_type === 'repeat' && step.steps && step.repeat_count) {
      for (let i = 0; i < step.repeat_count; i++) {
        out.push(...flattenSteps(step.steps))
      }
    } else {
      out.push(step)
    }
  }
  return out
}

/** Flatten workout steps into proportional bar segments, expanding repeat blocks
 * into their constituent steps. Weights use the raw `end_condition_value` when
 * every leaf step shares one unit; if the workout mixes time- and
 * distance-ended steps (e.g. a distance rep with a timed recovery), distance
 * steps are converted to pseudo-seconds first so proportions stay meaningful
 * instead of comparing metres to seconds directly. */
export function computeSegments(steps: WorkoutStep[]): StructureSegment[] {
  const flat = flattenSteps(steps)
  const units = new Set(
    flat
      .filter(s => s.end_condition_value != null && s.end_condition_value > 0)
      .map(s => s.end_condition),
  )
  const unitsMixed = units.size > 1
  return flat.map(step => ({ kind: segmentKind(step), weight: segmentWeight(step, unitsMixed) }))
}

const SEGMENT_COLORS: Record<StructureSegmentKind, string> = {
  warmup: 'var(--text-muted)',
  cooldown: 'var(--text-muted)',
  recover: 'var(--bg-hover)',
  work: 'var(--accent)',
}

interface Props {
  steps: WorkoutStep[]
  /** Accent for 'work' segments — pass the workout-type colour. Defaults to --accent. */
  color?: string
}

/** Proportional segment bar summarising a workout's warmup/work/recover/cooldown
 * shape. Tap/click reveals the full step-by-step breakdown (WorkoutSteps). */
export default function WorkoutStructureBar({ steps, color }: Props) {
  const [expanded, setExpanded] = useState(false)
  const segments = computeSegments(steps)
  if (segments.length === 0) return null

  return (
    <div className="workout-structure">
      <button
        type="button"
        className="workout-structure-bar"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={`Workout structure, ${segments.length} segments — tap for step-by-step breakdown`}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            className={`workout-structure-seg workout-structure-seg--${seg.kind}`}
            style={{ flex: seg.weight, background: seg.kind === 'work' && color ? color : SEGMENT_COLORS[seg.kind] }}
          />
        ))}
      </button>
      {expanded && (
        <div className="workout-structure-detail">
          <WorkoutSteps steps={steps} />
        </div>
      )}
    </div>
  )
}
